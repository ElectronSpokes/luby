import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/middleware/auth', () => ({
  getJwks: vi.fn(async () => 'mock-jwks' as unknown),
}));

vi.mock('../../src/config', () => ({
  getConfig: () => ({
    issuer: 'https://auth.theflux.life/application/o/luby/',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    apiBaseUrl: 'http://test-api',
    frontendUrl: 'http://test-frontend',
    sessionSecret: '',
  }),
}));

vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose');
  return {
    ...actual,
    jwtVerify: vi.fn(),
  };
});

import * as jose from 'jose';
import {
  exchangeCodeForTokens,
  TokenExchangeError,
} from '../../src/services/authentik';

const FAKE_TOKEN_RESPONSE = {
  access_token: 'access-test',
  id_token: 'id-test',
  expires_in: 3600,
};

describe('exchangeCodeForTokens', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('exchanges code and returns verified claims (happy path)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => FAKE_TOKEN_RESPONSE,
    });
    (jose.jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
      payload: { sub: 'user-1', email: 'a@b.com', name: 'A B', nonce: 'n1' },
    });

    const result = await exchangeCodeForTokens('the-code', 'http://test/cb');

    expect(result.accessToken).toBe('access-test');
    expect(result.idToken).toBe('id-test');
    expect(result.expiresIn).toBe(3600);
    expect(result.claims.sub).toBe('user-1');
    expect(result.claims.email).toBe('a@b.com');
  });

  it('throws TokenExchangeError on upstream HTTP failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    await expect(
      exchangeCodeForTokens('the-code', 'http://test/cb'),
    ).rejects.toBeInstanceOf(TokenExchangeError);
  });

  it('includes code_verifier in token POST body when supplied', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => FAKE_TOKEN_RESPONSE,
    });
    (jose.jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
      payload: { sub: 'u' },
    });

    const verifier = 'a'.repeat(43);
    await exchangeCodeForTokens('the-code', 'http://test/cb', verifier);

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = callArgs[1].body as URLSearchParams;
    expect(body.get('code_verifier')).toBe(verifier);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('redirect_uri')).toBe('http://test/cb');
    expect(body.get('client_id')).toBe('test-client-id');
    expect(body.get('client_secret')).toBe('test-client-secret');
  });

  it('omits code_verifier from body when not supplied (web flow)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => FAKE_TOKEN_RESPONSE,
    });
    (jose.jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
      payload: { sub: 'u' },
    });

    await exchangeCodeForTokens('the-code', 'http://test/cb');

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = callArgs[1].body as URLSearchParams;
    expect(body.has('code_verifier')).toBe(false);
  });
});
