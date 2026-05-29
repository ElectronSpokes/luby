import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  preferencesGetSpy,
  preferencesSetSpy,
  preferencesRemoveSpy,
  fetchSpy,
  prefStore,
} = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    preferencesGetSpy: vi.fn(async ({ key }: { key: string }) => ({
      value: store.get(key) ?? null,
    })),
    preferencesSetSpy: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
    preferencesRemoveSpy: vi.fn(async ({ key }: { key: string }) => {
      store.delete(key);
    }),
    fetchSpy: vi.fn(),
    prefStore: store,
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: preferencesGetSpy,
    set: preferencesSetSpy,
    remove: preferencesRemoveSpy,
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async () => ({ remove: vi.fn() })),
    getLaunchUrl: vi.fn(async () => undefined),
  },
}));

vi.mock('../../src/lib/native/platform', () => ({
  isNativePlatform: () => true,
  getPlatform: () => 'android',
  isAndroid: () => true,
  isIOS: () => false,
}));

import { exchangeCallback } from '../../src/hooks/useAuthentikDeepLink';
import { persistChallenge, type PkceChallenge } from '../../src/lib/native/pkce';

const FIXED_CHALLENGE: PkceChallenge = {
  verifier: 'a'.repeat(43),
  challenge: 'c'.repeat(43),
  state: 'state-abc',
  nonce: 'nonce-xyz',
};

beforeEach(() => {
  prefStore.clear();
  preferencesGetSpy.mockClear();
  preferencesSetSpy.mockClear();
  preferencesRemoveSpy.mockClear();
  fetchSpy.mockReset();
  global.fetch = fetchSpy as unknown as typeof fetch;
});

describe('exchangeCallback (FE-5 production consumer; luby Authentik PKCE)', () => {
  it('returns no_challenge when nothing was persisted', async () => {
    const outcome = await exchangeCallback({ code: 'abc', state: 'state-abc' });
    expect(outcome).toEqual({ ok: false, error: 'no_challenge' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns state_mismatch when stored state differs from URL state', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    const outcome = await exchangeCallback({ code: 'abc', state: 'wrong-state' });
    expect(outcome).toEqual({ ok: false, error: 'state_mismatch' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs to /api/v1/auth/mobile-callback with the exact BE-2 contract shape', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'jwt-xyz', expiresIn: 2592000 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const outcome = await exchangeCallback({ code: 'auth-code-xyz', state: 'state-abc' });

    expect(outcome).toEqual({ ok: true, token: 'jwt-xyz', expiresIn: 2592000 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/auth\/mobile-callback$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      code: 'auth-code-xyz',
      state: 'state-abc',
      code_verifier: FIXED_CHALLENGE.verifier,
      nonce: FIXED_CHALLENGE.nonce,
    });
  });

  it('returns status_<n> when the BE rejects the exchange', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    fetchSpy.mockResolvedValueOnce(new Response('Token exchange failed', { status: 400 }));
    const outcome = await exchangeCallback({ code: 'abc', state: 'state-abc' });
    expect(outcome).toEqual({ ok: false, error: 'status_400' });
  });

  it('returns network on fetch failure', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    fetchSpy.mockRejectedValueOnce(new TypeError('failed to fetch'));
    const outcome = await exchangeCallback({ code: 'abc', state: 'state-abc' });
    expect(outcome).toEqual({ ok: false, error: 'network' });
  });

  it('returns malformed_response when BE returns non-JWT envelope', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const outcome = await exchangeCallback({ code: 'abc', state: 'state-abc' });
    expect(outcome).toEqual({ ok: false, error: 'malformed_response' });
  });

  it('clears persisted challenge on successful consumption', async () => {
    await persistChallenge(FIXED_CHALLENGE);
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'jwt-1', expiresIn: 2592000 }), { status: 200 }),
    );
    await exchangeCallback({ code: 'abc', state: 'state-abc' });

    const second = await exchangeCallback({ code: 'abc', state: 'state-abc' });
    expect(second).toEqual({ ok: false, error: 'no_challenge' });
  });
});
