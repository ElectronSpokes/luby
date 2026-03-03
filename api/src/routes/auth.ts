import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import * as jose from 'jose';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>();

// Apply auth middleware to /me endpoint
authRoutes.use('/me', authMiddleware);

const getConfig = () => ({
  issuer: process.env.AUTHENTIK_ISSUER || 'https://auth.theflux.life/application/o/luby/',
  clientId: process.env.AUTHENTIK_CLIENT_ID || 'luby-api',
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.110.27:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://10.0.110.27:3000',
});

// GET /auth/login - Initiate OIDC login
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

// GET /auth/callback - Handle OIDC callback
authRoutes.get('/callback', async (c) => {
  const config = getConfig();
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = c.req.header('Cookie')?.match(/oauth_state=([^;]+)/)?.[1];
  const storedNonce = c.req.header('Cookie')?.match(/oauth_nonce=([^;]+)/)?.[1];

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }

  if (state !== storedState) {
    return c.json({ error: 'Invalid state' }, 400);
  }

  try {
    const tokenResponse = await fetch('https://auth.theflux.life/application/o/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: `${config.apiBaseUrl}/api/v1/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return c.json({ error: 'Token exchange failed' }, 400);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      id_token: string;
      expires_in: number;
    };

    // Verify ID token
    const jwks = jose.createRemoteJWKSet(new URL(`${config.issuer}jwks/`));
    const { payload } = await jose.jwtVerify(tokens.id_token, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    if (payload.nonce !== storedNonce) {
      return c.json({ error: 'Invalid nonce' }, 400);
    }

    // Set session cookie
    setCookie(c, 'luby_session', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      domain: '.myluby.net',
      maxAge: tokens.expires_in,
      path: '/',
    });

    // Clear OAuth cookies
    setCookie(c, 'oauth_state', '', { maxAge: 0, path: '/' });
    setCookie(c, 'oauth_nonce', '', { maxAge: 0, path: '/' });

    return c.redirect(config.frontendUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// GET /auth/logout
authRoutes.get('/logout', (c) => {
  const config = getConfig();

  setCookie(c, 'luby_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    domain: '.myluby.net',
    maxAge: 0,
    path: '/',
  });

  return c.redirect(config.frontendUrl);
});

// GET /auth/me - Get current user
authRoutes.get('/me', (c) => {
  const auth = c.get('auth');

  if (!auth?.user) {
    return c.json({ user: null });
  }

  return c.json({
    user: {
      sub: auth.user.sub,
      email: auth.user.email,
      name: auth.user.name,
      preferred_username: auth.user.preferred_username,
    }
  });
});
