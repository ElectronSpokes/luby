/**
 * Unit tests for src/lib/native/pkce.ts (ported from dogfood verbatim
 * except for the import path — pkce.ts is byte-identical between projects).
 *
 * `clearChallenge` covers FR-9 / FR-23 (sign-out clears native session storage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { store, setSpy, getSpy, removeSpy } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    setSpy: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
    getSpy: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
    removeSpy: vi.fn(async ({ key }: { key: string }) => {
      store.delete(key);
    }),
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: { set: setSpy, get: getSpy, remove: removeSpy },
}));

import {
  generateChallenge,
  persistChallenge,
  consumeChallenge,
  clearChallenge,
} from '../../../src/lib/native/pkce';

const PKCE_KEYS = ['pkce_verifier', 'pkce_nonce', 'pkce_state'] as const;

beforeEach(() => {
  store.clear();
  setSpy.mockClear();
  getSpy.mockClear();
  removeSpy.mockClear();
});

describe('generateChallenge', () => {
  it('returns base64url-safe verifier and challenge (no +, /, or = chars)', async () => {
    const c = await generateChallenge();
    expect(c.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(c.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('verifier is 32 random bytes base64url-encoded (43 chars)', async () => {
    const c = await generateChallenge();
    expect(c.verifier).toHaveLength(43);
  });

  it('challenge is SHA-256 of verifier base64url-encoded (43 chars)', async () => {
    const c = await generateChallenge();
    expect(c.challenge).toHaveLength(43);
  });

  it('challenge matches manual SHA-256 of verifier', async () => {
    const c = await generateChallenge();
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(c.verifier));
    const arr = new Uint8Array(hash);
    let bin = '';
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    const expected = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(c.challenge).toBe(expected);
  });

  it('state and nonce are UUIDs', async () => {
    const c = await generateChallenge();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(c.state).toMatch(uuid);
    expect(c.nonce).toMatch(uuid);
  });

  it('produces distinct values across calls (high-entropy)', async () => {
    const a = await generateChallenge();
    const b = await generateChallenge();
    expect(a.verifier).not.toBe(b.verifier);
    expect(a.challenge).not.toBe(b.challenge);
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
  });
});

describe('persistChallenge / consumeChallenge', () => {
  it('persistChallenge writes verifier, nonce, state to Preferences', async () => {
    const c = await generateChallenge();
    await persistChallenge(c);
    expect(store.get('pkce_verifier')).toBe(c.verifier);
    expect(store.get('pkce_nonce')).toBe(c.nonce);
    expect(store.get('pkce_state')).toBe(c.state);
  });

  it('consumeChallenge returns stored values AND clears them (single-use)', async () => {
    const c = await generateChallenge();
    await persistChallenge(c);
    const consumed = await consumeChallenge();
    expect(consumed).toEqual({ verifier: c.verifier, nonce: c.nonce, state: c.state });
    for (const key of PKCE_KEYS) {
      expect(store.has(key)).toBe(false);
    }
  });

  it('consumeChallenge returns null when nothing is stored', async () => {
    expect(await consumeChallenge()).toBeNull();
  });

  it('consumeChallenge returns null when ONLY some keys are stored', async () => {
    await setSpy({ key: 'pkce_verifier', value: 'v' });
    await setSpy({ key: 'pkce_state', value: 's' });
    expect(await consumeChallenge()).toBeNull();
  });

  it('a second consumeChallenge after a successful one returns null', async () => {
    const c = await generateChallenge();
    await persistChallenge(c);
    await consumeChallenge();
    expect(await consumeChallenge()).toBeNull();
  });
});

describe('clearChallenge', () => {
  it('removes verifier, nonce, AND state from Preferences', async () => {
    const c = await generateChallenge();
    await persistChallenge(c);
    expect(store.size).toBe(3);

    await clearChallenge();

    for (const key of PKCE_KEYS) {
      expect(store.has(key)).toBe(false);
    }
    expect(removeSpy).toHaveBeenCalledWith({ key: 'pkce_verifier' });
    expect(removeSpy).toHaveBeenCalledWith({ key: 'pkce_nonce' });
    expect(removeSpy).toHaveBeenCalledWith({ key: 'pkce_state' });
  });

  it('is idempotent when called against an empty store', async () => {
    await clearChallenge();
    expect(store.size).toBe(0);
  });
});
