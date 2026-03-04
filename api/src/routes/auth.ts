import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import * as jose from 'jose';
import { authMiddleware, getJwks, upsertUser } from '../middleware/auth';
import { getConfig } from '../config';
import type { AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>();

// Server-side state store for mobile OAuth (cookies don't work in system browser)
const mobileOAuthStore = new Map<string, { nonce: string; createdAt: number }>();

// Clean up expired entries (older than 5 minutes)
function cleanupMobileStore() {
  const now = Date.now();
  for (const [key, val] of mobileOAuthStore) {
    if (now - val.createdAt > 300_000) mobileOAuthStore.delete(key);
  }
}

// Apply auth middleware to /me endpoint
authRoutes.use('/me', authMiddleware);

// GET /auth/login - Initiate OIDC login
authRoutes.get('/login', async (c) => {
  const config = getConfig();
  const isMobile = c.req.query('mobile') === 'true';
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const redirectUri = isMobile
    ? `${config.apiBaseUrl}/api/v1/auth/callback/mobile`
    : `${config.apiBaseUrl}/api/v1/auth/callback`;

  if (isMobile) {
    // Store state server-side for mobile (system browser can't share cookies)
    cleanupMobileStore();
    mobileOAuthStore.set(state, { nonce, createdAt: Date.now() });
  } else {
    // Web: use cookies as before
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
  }

  const authUrl = new URL('https://auth.theflux.life/application/o/authorize/');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  if (isMobile) {
  }

  return c.redirect(authUrl.toString());
});

// GET /auth/callback - Handle OIDC callback (web)
authRoutes.get('/callback', async (c) => {
  const config = getConfig();
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  const storedNonce = getCookie(c, 'oauth_nonce');

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

    const jwks = await getJwks();
    const { payload } = await jose.jwtVerify(tokens.id_token, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    if (!storedNonce || payload.nonce !== storedNonce) {
      return c.json({ error: 'Invalid nonce' }, 400);
    }

    await upsertUser({
      type: 'human',
      sub: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      preferred_username: payload.preferred_username as string | undefined,
    });

    setCookie(c, 'luby_session', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      domain: '.myluby.net',
      maxAge: tokens.expires_in,
      path: '/',
    });

    setCookie(c, 'oauth_state', '', { maxAge: 0, path: '/' });
    setCookie(c, 'oauth_nonce', '', { maxAge: 0, path: '/' });

    return c.redirect(config.frontendUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// GET /auth/callback/mobile - Handle OIDC callback (mobile deep link)
authRoutes.get('/callback/mobile', async (c) => {
  const config = getConfig();
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }

  // Look up state from server-side store (not cookies)
  const stored = mobileOAuthStore.get(state);
  if (!stored) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }
  mobileOAuthStore.delete(state);

  try {
    const tokenResponse = await fetch('https://auth.theflux.life/application/o/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: `${config.apiBaseUrl}/api/v1/auth/callback/mobile`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Mobile token exchange failed:', error);
      return c.json({ error: 'Token exchange failed' }, 400);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      id_token: string;
      expires_in: number;
    };

    const jwks = await getJwks();
    const { payload } = await jose.jwtVerify(tokens.id_token, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    if (payload.nonce !== stored.nonce) {
      return c.json({ error: 'Invalid nonce' }, 400);
    }

    await upsertUser({
      type: 'human',
      sub: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      preferred_username: payload.preferred_username as string | undefined,
    });

    // Redirect to mobile app via deep link with the access token
    const deepLink = `net.myluby.app://auth/callback?token=${encodeURIComponent(tokens.access_token)}&expires_in=${tokens.expires_in}`;
    return c.redirect(deepLink);
  } catch (error) {
    console.error('Mobile OAuth callback error:', error);
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
