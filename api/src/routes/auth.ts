import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import * as jose from 'jose';
import { authMiddleware, getJwks, upsertUser, lookupUserByEmail } from '../middleware/auth';
import { exchangeCodeForTokens, TokenExchangeError } from '../services/authentik';
import { getConfig } from '../config';
import { sql } from '../db/client';
import type { AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>();

authRoutes.use('/me', authMiddleware);

// GET /auth/login - Redirect to Authentik (web only)
authRoutes.get('/login', async (c) => {
  const config = getConfig();
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 300,
    path: '/',
  });
  setCookie(c, 'oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 300,
    path: '/',
  });

  const authUrl = new URL('https://auth.theflux.life/application/o/authorize/');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('redirect_uri', `${config.apiBaseUrl}/api/v1/auth/callback`);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  return c.redirect(authUrl.toString());
});

// GET /auth/callback - Web (cookie-based)
authRoutes.get('/callback', async (c) => {
  const config = getConfig();
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  const storedNonce = getCookie(c, 'oauth_nonce');

  if (!code || !state) return c.json({ error: 'Missing code or state' }, 400);
  if (state !== storedState) return c.json({ error: 'Invalid state' }, 400);

  try {
    const result = await exchangeCodeForTokens(
      code,
      `${config.apiBaseUrl}/api/v1/auth/callback`,
    );

    if (!storedNonce || result.claims.nonce !== storedNonce) {
      return c.json({ error: 'Invalid nonce' }, 400);
    }

    await upsertUser({
      type: 'human',
      sub: result.claims.sub,
      email: result.claims.email as string | undefined,
      name: result.claims.name as string | undefined,
      preferred_username: result.claims.preferred_username as string | undefined,
    });

    setCookie(c, 'luby_session', result.accessToken, {
      httpOnly: true, secure: true, sameSite: 'None',
      domain: '.myluby.net', maxAge: result.expiresIn, path: '/',
    });
    setCookie(c, 'oauth_state', '', { maxAge: 0, path: '/' });
    setCookie(c, 'oauth_nonce', '', { maxAge: 0, path: '/' });

    return c.redirect(config.frontendUrl);
  } catch (error) {
    if (error instanceof TokenExchangeError) {
      console.error('Token exchange failed:', error.upstreamBody);
      return c.json({ error: 'Token exchange failed' }, 400);
    }
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

const NATIVE_REDIRECT_URI = 'net.myluby.app://callback';
const MOBILE_JWT_TTL_SECONDS = 30 * 24 * 60 * 60;

// POST /auth/mobile-callback - Native Android (Authentik OIDC + PKCE)
authRoutes.post('/mobile-callback', async (c) => {
  const config = getConfig();

  if (!config.sessionSecret) {
    return c.json({ error: 'Mobile callback not configured' }, 500);
  }

  let body: {
    code?: string;
    code_verifier?: string;
    state?: string;
    nonce?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.code) return c.json({ error: 'Missing code' }, 400);
  if (!body.code_verifier || body.code_verifier.length < 43) {
    return c.json(
      { error: 'Missing or invalid code_verifier (RFC 7636 requires ≥43 chars)' },
      400,
    );
  }

  try {
    const result = await exchangeCodeForTokens(
      body.code,
      NATIVE_REDIRECT_URI,
      body.code_verifier,
    );

    if (body.nonce && result.claims.nonce !== body.nonce) {
      return c.json({ error: 'Invalid nonce' }, 400);
    }

    await upsertUser({
      type: 'human',
      sub: result.claims.sub,
      email: result.claims.email as string | undefined,
      name: result.claims.name as string | undefined,
      preferred_username: result.claims.preferred_username as string | undefined,
    });

    const secret = new TextEncoder().encode(config.sessionSecret);
    const token = await new jose.SignJWT({
      sub: result.claims.sub,
      email: result.claims.email,
      name: (result.claims.name as string | undefined) || null,
      type: 'luby_session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${MOBILE_JWT_TTL_SECONDS}s`)
      .sign(secret);

    console.log(`Mobile sign-in: ${result.claims.email}`);
    return c.json({ token, expiresIn: MOBILE_JWT_TTL_SECONDS });
  } catch (error) {
    if (error instanceof TokenExchangeError) {
      console.error('Token exchange failed:', error.upstreamBody);
      return c.json({ error: 'Token exchange failed' }, 400);
    }
    if (error instanceof jose.errors.JOSEError) {
      console.error('id_token verification failed:', error.message);
      return c.json({ error: 'Invalid id_token' }, 400);
    }
    console.error('Mobile callback error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/google-signin - Native mobile Google Sign-In
authRoutes.post('/google-signin', async (c) => {
  const config = getConfig();

  if (!config.googleClientId || !config.sessionSecret) {
    return c.json({ error: 'Google Sign-In not configured' }, 500);
  }

  let body: { idToken: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body.idToken) {
    return c.json({ error: 'Missing idToken' }, 400);
  }

  try {
    // Verify Google ID token via Google's JWKS
    const googleJwks = jose.createRemoteJWKSet(
      new URL('https://www.googleapis.com/oauth2/v3/certs')
    );
    const { payload } = await jose.jwtVerify(body.idToken, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      // Accept tokens for any of our client IDs (web + android)
    });

    const email = payload.email as string;
    const name = payload.name as string | undefined;
    const googleSub = payload.sub as string;

    if (!email) {
      return c.json({ error: 'No email in Google token' }, 400);
    }

    // Look up existing user by email (may have been created via web/Authentik login)
    const existing = await lookupUserByEmail(email);

    let userSub: string;

    if (existing) {
      // Existing user — keep their original sub, just update name
      userSub = existing.sub;
      await sql`UPDATE users SET name = COALESCE(${name || null}, name), updated_at = NOW() WHERE id = ${existing.id}`;
    } else {
      // New user — create with google-prefixed sub
      userSub = `google:${googleSub}`;
      await sql`
        INSERT INTO users (sub, email, name)
        VALUES (${userSub}, ${email}, ${name || null})
      `;
    }

    // Sign our own JWT (30-day expiry)
    const secret = new TextEncoder().encode(config.sessionSecret);
    const expiresIn = 30 * 24 * 60 * 60;
    const token = await new jose.SignJWT({
      sub: userSub,
      email,
      name: name || null,
      type: 'luby_session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expiresIn}s`)
      .sign(secret);

    console.log(`Google Sign-In: ${email} (${existing ? 'existing' : 'new'} user)`);
    return c.json({ token, expiresIn });
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
});

// GET /auth/logout
authRoutes.get('/logout', (c) => {
  const config = getConfig();
  setCookie(c, 'luby_session', '', {
    httpOnly: true, secure: true, sameSite: 'None',
    domain: '.myluby.net', maxAge: 0, path: '/',
  });
  return c.redirect(config.frontendUrl);
});

// GET /auth/me
authRoutes.get('/me', (c) => {
  const auth = c.get('auth');
  if (!auth?.user) return c.json({ user: null });
  return c.json({
    user: {
      sub: auth.user.sub,
      email: auth.user.email,
      name: auth.user.name,
      preferred_username: auth.user.preferred_username,
    }
  });
});
