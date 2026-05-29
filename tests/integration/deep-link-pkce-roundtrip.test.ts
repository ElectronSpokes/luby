import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { URLOpenListenerEvent, AppLaunchUrl } from '@capacitor/app';

import type { CallbackParams } from '../../src/lib/native/deep-link';

type AppUrlListener = (event: URLOpenListenerEvent) => void;

const API_BASE_URL = 'http://localhost:3000';

const {
  appAddListenerSpy,
  appGetLaunchUrlSpy,
  appRemoveSpy,
  preferencesGetSpy,
  preferencesSetSpy,
  preferencesRemoveSpy,
  capturedAppUrlListener,
  fetchSpy,
  prefStore,
} = vi.hoisted(() => {
  const store = new Map<string, string>();
  const get = vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null }));
  const set = vi.fn(async ({ key, value }: { key: string; value: string }) => {
    store.set(key, value);
  });
  const remove = vi.fn(async ({ key }: { key: string }) => {
    store.delete(key);
  });
  const captured = { current: null as AppUrlListener | null };
  const remListener = vi.fn(async () => {
    captured.current = null;
  });
  const addListener = vi.fn(async (event: string, cb: AppUrlListener) => {
    if (event === 'appUrlOpen') captured.current = cb;
    return { remove: remListener };
  });
  return {
    appAddListenerSpy: addListener,
    appGetLaunchUrlSpy: vi.fn(async (): Promise<AppLaunchUrl | undefined> => undefined),
    appRemoveSpy: remListener,
    preferencesGetSpy: get,
    preferencesSetSpy: set,
    preferencesRemoveSpy: remove,
    capturedAppUrlListener: captured,
    fetchSpy: vi.fn(),
    prefStore: store,
  };
});

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: appAddListenerSpy,
    getLaunchUrl: appGetLaunchUrlSpy,
  },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: preferencesGetSpy,
    set: preferencesSetSpy,
    remove: preferencesRemoveSpy,
  },
}));

vi.mock('../../src/lib/native/platform', () => ({
  isNativePlatform: () => true,
  getPlatform: () => 'android',
  isAndroid: () => true,
  isIOS: () => false,
}));

import {
  onCallback,
  consumeLaunchCallback,
  NATIVE_REDIRECT_URI,
} from '../../src/lib/native/deep-link';
import {
  generateChallenge,
  persistChallenge,
  consumeChallenge,
} from '../../src/lib/native/pkce';

beforeAll(() => {
  global.fetch = fetchSpy as unknown as typeof fetch;
});

beforeEach(() => {
  appAddListenerSpy.mockClear();
  appGetLaunchUrlSpy.mockReset();
  appRemoveSpy.mockClear();
  preferencesGetSpy.mockClear();
  preferencesSetSpy.mockClear();
  preferencesRemoveSpy.mockClear();
  capturedAppUrlListener.current = null;
  prefStore.clear();
  fetchSpy.mockReset();
});

// In-test composer for the deep-link → PKCE → BE-2 callback round-trip.
// Uses Luby's BE-2 contract shape ({token, expiresIn}); this test asserts
// composition behaviour with a mocked fetch.
type CallbackResult =
  | { ok: true; token: string; expiresIn: number }
  | { ok: false; error: 'no_challenge' | 'state_mismatch' | `status_${number}` };

async function handleCallback({ code, state }: CallbackParams): Promise<CallbackResult> {
  const stored = await consumeChallenge();
  if (!stored) return { ok: false, error: 'no_challenge' };
  if (state !== stored.state) return { ok: false, error: 'state_mismatch' };
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/mobile-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      state,
      code_verifier: stored.verifier,
      nonce: stored.nonce,
    }),
  });
  if (!res.ok) return { ok: false, error: `status_${res.status}` };
  const data = (await res.json()) as { token: string; expiresIn: number };
  return { ok: true, token: data.token, expiresIn: data.expiresIn };
}

function mockCallbackOk(token = 'jwt-tester', expiresIn = 2592000) {
  fetchSpy.mockImplementation(
    async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ token, expiresIn }),
      }) as Response,
  );
}

function mockCallbackError(status: number) {
  fetchSpy.mockImplementation(
    async () =>
      ({
        ok: false,
        status,
        json: async () => ({ error: 'bad' }),
      }) as Response,
  );
}

function fireAppUrlOpen(url: string) {
  capturedAppUrlListener.current!({ url } as URLOpenListenerEvent);
}

describe('Deep-link + PKCE round-trip (luby Authentik)', () => {
  it('happy path: persist challenge → appUrlOpen → consume → POST /mobile-callback succeeds with correct body', async () => {
    mockCallbackOk();
    const challenge = await generateChallenge();
    await persistChallenge(challenge);
    let pending: Promise<CallbackResult> | null = null;
    await onCallback((params) => {
      pending = handleCallback(params);
    });

    fireAppUrlOpen(`${NATIVE_REDIRECT_URI}?code=AUTHCODE&state=${challenge.state}`);

    expect(pending, 'listener did not fire').not.toBeNull();
    const result = await pending!;
    expect(result).toMatchObject({ ok: true, token: 'jwt-tester', expiresIn: 2592000 });
    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/v1/auth/mobile-callback`,
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      code: 'AUTHCODE',
      state: challenge.state,
      code_verifier: challenge.verifier,
      nonce: challenge.nonce,
    });
  });

  it('state mismatch: stored state ≠ callback state → error, no fetch', async () => {
    const challenge = await generateChallenge();
    await persistChallenge(challenge);
    let pending: Promise<CallbackResult> | null = null;
    await onCallback((params) => {
      pending = handleCallback(params);
    });

    fireAppUrlOpen(`${NATIVE_REDIRECT_URI}?code=AUTHCODE&state=WRONG_STATE`);

    expect(pending, 'listener did not fire').not.toBeNull();
    const result = await pending!;
    expect(result).toEqual({ ok: false, error: 'state_mismatch' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('no persisted challenge: consumeChallenge returns null → no_challenge error', async () => {
    let pending: Promise<CallbackResult> | null = null;
    await onCallback((params) => {
      pending = handleCallback(params);
    });

    fireAppUrlOpen(`${NATIVE_REDIRECT_URI}?code=AUTHCODE&state=X`);

    expect(pending, 'listener did not fire').not.toBeNull();
    const result = await pending!;
    expect(result).toEqual({ ok: false, error: 'no_challenge' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('appUrlOpen with non-callback URL (wrong scheme) → listener consumer not invoked', async () => {
    const challenge = await generateChallenge();
    await persistChallenge(challenge);
    let called = false;
    await onCallback(() => {
      called = true;
    });

    fireAppUrlOpen('https://example.com/?code=X');

    expect(called).toBe(false);
  });

  it('appUrlOpen URL missing code → listener consumer not invoked', async () => {
    let called = false;
    await onCallback(() => {
      called = true;
    });

    fireAppUrlOpen(`${NATIVE_REDIRECT_URI}?state=ONLY`);

    expect(called).toBe(false);
  });

  it('POST /mobile-callback returns 400 → status_400 error', async () => {
    mockCallbackError(400);
    const challenge = await generateChallenge();
    await persistChallenge(challenge);
    let pending: Promise<CallbackResult> | null = null;
    await onCallback((params) => {
      pending = handleCallback(params);
    });

    fireAppUrlOpen(`${NATIVE_REDIRECT_URI}?code=AUTHCODE&state=${challenge.state}`);

    expect(pending, 'listener did not fire').not.toBeNull();
    const result = await pending!;
    expect(result).toEqual({ ok: false, error: 'status_400' });
  });

  it('Preferences cleared after consume: verifier/nonce/state removed from store', async () => {
    const challenge = await generateChallenge();
    await persistChallenge(challenge);
    expect(prefStore.size).toBe(3);

    const stored = await consumeChallenge();

    expect(stored).toMatchObject({
      verifier: challenge.verifier,
      nonce: challenge.nonce,
      state: challenge.state,
    });
    expect(prefStore.size).toBe(0);
  });

  it('listener cleanup: unsubscribe invokes handle.remove and detaches the listener', async () => {
    const consumerSpy = vi.fn();
    const off = await onCallback(consumerSpy);
    expect(appAddListenerSpy).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
    expect(capturedAppUrlListener.current).not.toBeNull();

    off();
    await Promise.resolve();
    await Promise.resolve();

    expect(appRemoveSpy).toHaveBeenCalledOnce();
    expect(capturedAppUrlListener.current).toBeNull();
    expect(consumerSpy).not.toHaveBeenCalled();
  });

  it('consumeLaunchCallback: App.getLaunchUrl returns valid callback URL → CallbackParams', async () => {
    appGetLaunchUrlSpy.mockResolvedValueOnce({
      url: `${NATIVE_REDIRECT_URI}?code=FROMLAUNCH&state=X`,
    });

    const params = await consumeLaunchCallback();

    expect(params).toEqual({ code: 'FROMLAUNCH', state: 'X' });
  });

  it('consumeLaunchCallback: App.getLaunchUrl returns undefined → null', async () => {
    appGetLaunchUrlSpy.mockResolvedValueOnce(undefined as unknown as AppLaunchUrl);

    const params = await consumeLaunchCallback();

    expect(params).toBeNull();
  });
});
