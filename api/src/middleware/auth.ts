import { Context, Next } from 'hono';
import * as jose from 'jose';
import { sql } from '../db/client';
import type { AuthContext, AuthUser } from '../types';

const getConfig = () => ({
  issuer: process.env.AUTHENTIK_ISSUER || 'https://auth.theflux.life/application/o/luby/',
  clientId: process.env.AUTHENTIK_CLIENT_ID || 'luby-api',
});

let jwks: jose.JWTVerifyGetKey | null = null;

async function getJwks(): Promise<jose.JWTVerifyGetKey> {
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

// Upsert user and return DB id
async function upsertUser(user: AuthUser): Promise<number> {
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

export async function authMiddleware(c: Context, next: Next) {
  let user: AuthUser | null = null;

  // Check Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    user = await verifyAuthentikToken(authHeader.slice(7));
  }

  // Check session cookie
  const sessionCookie = c.req.header('Cookie')?.match(/luby_session=([^;]+)/);
  if (!user && sessionCookie) {
    user = await verifyAuthentikToken(sessionCookie[1]);
  }

  let userId: number | null = null;
  if (user?.sub) {
    userId = await upsertUser(user);
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
