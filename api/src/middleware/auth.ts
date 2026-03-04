import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import * as jose from 'jose';
import { sql } from '../db/client';
import { getConfig } from '../config';
import type { AuthContext, AuthUser } from '../types';

let jwks: jose.JWTVerifyGetKey | null = null;

export async function getJwks(): Promise<jose.JWTVerifyGetKey> {
  if (!jwks) {
    const config = getConfig();
    jwks = jose.createRemoteJWKSet(new URL(`${config.issuer}jwks/`));
  }
  return jwks;
}

async function verifyAuthentikToken(token: string): Promise<AuthUser | null> {
  try {
    const config = getConfig();
    const jwksClient = await getJwks();
    const { payload } = await jose.jwtVerify(token, jwksClient, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    return {
      type: 'human',
      sub: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      preferred_username: payload.preferred_username as string | undefined,
      groups: payload.groups as string[] | undefined,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Upsert user — called only on login callback, not every request
export async function upsertUser(user: AuthUser): Promise<number> {
  const [row] = await sql`
    INSERT INTO users (sub, email, name)
    VALUES (${user.sub!}, ${user.email || null}, ${user.name || null})
    ON CONFLICT (sub) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(EXCLUDED.name, users.name),
      updated_at = NOW()
    RETURNING id
  `;
  return row.id;
}

// Lookup user by sub — fast SELECT, no write
async function lookupUser(sub: string): Promise<number | null> {
  const [row] = await sql`SELECT id FROM users WHERE sub = ${sub}`;
  return row?.id ?? null;
}

export async function authMiddleware(c: Context, next: Next) {
  let user: AuthUser | null = null;

  // Check Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    user = await verifyAuthentikToken(authHeader.slice(7));
  }

  // Check session cookie (using Hono's getCookie)
  if (!user) {
    const sessionToken = getCookie(c, 'luby_session');
    if (sessionToken) {
      user = await verifyAuthentikToken(sessionToken);
    }
  }

  let userId: number | null = null;
  if (user?.sub) {
    userId = await lookupUser(user.sub);
  }

  const authContext: AuthContext = { user, userId };
  c.set('auth', authContext);
  await next();
}

export async function requireAuth(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined;

  if (!auth?.user || !auth.userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  await next();
}
