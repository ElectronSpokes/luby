import { describe, it, expect, vi, beforeEach } from 'vitest';

const { addListenerSpy, getLaunchUrlSpy, removeSpy, platformState, lastListener } = vi.hoisted(() => ({
  addListenerSpy: vi.fn(),
  getLaunchUrlSpy: vi.fn(),
  removeSpy: vi.fn(async () => undefined),
  platformState: { native: true },
  lastListener: { current: null as ((event: { url: string }) => void) | null },
}));

addListenerSpy.mockImplementation(async (_event: string, cb: (event: { url: string }) => void) => {
  lastListener.current = cb;
  return { remove: removeSpy };
});

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: addListenerSpy,
    getLaunchUrl: getLaunchUrlSpy,
  },
}));

vi.mock('../../../src/lib/native/platform', () => ({
  isNativePlatform: () => platformState.native,
}));

import {
  parseCallbackUrl,
  onCallback,
  consumeLaunchCallback,
  NATIVE_REDIRECT_URI,
} from '../../../src/lib/native/deep-link';

beforeEach(() => {
  addListenerSpy.mockClear();
  getLaunchUrlSpy.mockReset();
  removeSpy.mockClear();
  lastListener.current = null;
  platformState.native = true;
});

describe('NATIVE_REDIRECT_URI', () => {
  it('is the canonical net.myluby.app://callback custom-scheme URI', () => {
    expect(NATIVE_REDIRECT_URI).toBe('net.myluby.app://callback');
  });
});

describe('parseCallbackUrl', () => {
  it('returns null when the scheme does not match', () => {
    expect(parseCallbackUrl('https://myluby.net/callback?code=abc')).toBeNull();
    expect(parseCallbackUrl('net.other.app://callback?code=abc')).toBeNull();
  });

  it('returns null when code is missing', () => {
    expect(parseCallbackUrl('net.myluby.app://callback')).toBeNull();
    expect(parseCallbackUrl('net.myluby.app://callback?state=xyz')).toBeNull();
  });

  it('returns code + state when both are present', () => {
    expect(parseCallbackUrl('net.myluby.app://callback?code=abc&state=xyz')).toEqual({
      code: 'abc',
      state: 'xyz',
    });
  });

  it('returns code with null state when state is absent', () => {
    expect(parseCallbackUrl('net.myluby.app://callback?code=abc')).toEqual({
      code: 'abc',
      state: null,
    });
  });
});

describe('onCallback', () => {
  it('returns an immediate no-op unsubscribe on web (no addListener call)', async () => {
    platformState.native = false;
    const off = await onCallback(() => {});
    expect(addListenerSpy).not.toHaveBeenCalled();
    off();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('registers an appUrlOpen listener and forwards parsed params on native', async () => {
    const listener = vi.fn();
    const off = await onCallback(listener);
    expect(addListenerSpy).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
    lastListener.current?.({ url: 'net.myluby.app://callback?code=abc&state=xyz' });
    expect(listener).toHaveBeenCalledWith({ code: 'abc', state: 'xyz' });
    off();
    expect(removeSpy).toHaveBeenCalledOnce();
  });

  it('does not invoke listener for non-matching URLs', async () => {
    const listener = vi.fn();
    const off = await onCallback(listener);
    lastListener.current?.({ url: 'https://other.example/callback?code=abc' });
    lastListener.current?.({ url: 'net.myluby.app://callback' });
    expect(listener).not.toHaveBeenCalled();
    off();
  });
});

describe('consumeLaunchCallback', () => {
  it('returns null on web without calling getLaunchUrl', async () => {
    platformState.native = false;
    expect(await consumeLaunchCallback()).toBeNull();
    expect(getLaunchUrlSpy).not.toHaveBeenCalled();
  });

  it('returns null when getLaunchUrl returns null', async () => {
    getLaunchUrlSpy.mockResolvedValue(null);
    expect(await consumeLaunchCallback()).toBeNull();
  });

  it('returns null when getLaunchUrl returns no url', async () => {
    getLaunchUrlSpy.mockResolvedValue({ url: '' });
    expect(await consumeLaunchCallback()).toBeNull();
  });

  it('returns parsed callback when launch URL matches', async () => {
    getLaunchUrlSpy.mockResolvedValue({ url: 'net.myluby.app://callback?code=abc&state=xyz' });
    expect(await consumeLaunchCallback()).toEqual({ code: 'abc', state: 'xyz' });
  });

  it('returns null when launch URL is unrelated', async () => {
    getLaunchUrlSpy.mockResolvedValue({ url: 'https://myluby.net/' });
    expect(await consumeLaunchCallback()).toBeNull();
  });
});
