import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import {
  onCallback,
  consumeLaunchCallback,
  NATIVE_REDIRECT_URI,
  type CallbackParams,
} from '../lib/native/deep-link';
import { consumeChallenge } from '../lib/native/pkce';
import { isNativePlatform } from '../lib/native/platform';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.0.110.27:3001';

export const AUTHORIZE_URL =
  import.meta.env.VITE_AUTHENTIK_AUTHORIZE_URL ||
  'https://auth.theflux.life/application/o/authorize/';

// Authentik OIDC client_id for the luby application. Public per OAuth 2.0
// (not a secret); same precedent as dogfood NativeAuthButton CLIENT_ID. CI
// build env can override via VITE_AUTHENTIK_CLIENT_ID for rotation without
// code change. Default 'luby-api' matches api/src/config.ts dev fallback.
export const CLIENT_ID =
  import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'luby-api';

export const SCOPE = 'openid email profile';

export type CallbackOutcome =
  | { ok: true; token: string; expiresIn: number }
  | {
      ok: false;
      error:
        | 'no_challenge'
        | 'state_mismatch'
        | 'network'
        | `status_${number}`
        | 'malformed_response';
    };

interface CallbackResponse {
  token: string;
  expiresIn: number;
}

export async function exchangeCallback({
  code,
  state,
}: CallbackParams): Promise<CallbackOutcome> {
  const stored = await consumeChallenge();
  if (!stored) return { ok: false, error: 'no_challenge' };
  if (state !== stored.state) return { ok: false, error: 'state_mismatch' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/auth/mobile-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        code_verifier: stored.verifier,
        nonce: stored.nonce,
      }),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  if (!res.ok) return { ok: false, error: `status_${res.status}` };

  let data: CallbackResponse;
  try {
    data = (await res.json()) as CallbackResponse;
  } catch {
    return { ok: false, error: 'malformed_response' };
  }

  if (typeof data.token !== 'string' || typeof data.expiresIn !== 'number') {
    return { ok: false, error: 'malformed_response' };
  }

  return { ok: true, token: data.token, expiresIn: data.expiresIn };
}

export function useAuthentikDeepLink(
  onSuccess?: () => Promise<void> | void,
): void {
  useEffect(() => {
    if (!isNativePlatform()) return;
    let cancelled = false;
    let processed = false;
    let removeListener: (() => void) | null = null;

    const handle = async (params: CallbackParams): Promise<void> => {
      // Dedup: on cold-start both `App.getLaunchUrl()` (via consumeLaunchCallback)
      // and the `appUrlOpen` listener can deliver the same intent URL. First
      // arrival processes; second is a no-op (without this guard, the loser
      // sees `no_challenge` because consumeChallenge() is destructive).
      if (processed) return;
      processed = true;
      const outcome = await exchangeCallback(params);
      if (cancelled) return;
      if (!outcome.ok) {
        // Cast: luby tsconfig lacks `strict: true` (vs dogfood) so control-
        // flow narrowing on discriminated unions doesn't propagate here.
        // Fixing project-wide is out of this wave's scope (same gap affects
        // src/lib/{api,useAuth}.ts on import.meta.env access).
        const failure = outcome as Extract<CallbackOutcome, { ok: false }>;
        console.error('[auth] Native callback exchange failed:', failure.error);
        return;
      }
      // Luby is a Capacitor SPA — state lives in useAuth's `user`, not in
      // cookies. Write JWT to Preferences (api.ts reads on every request),
      // then onSuccess re-fetches /auth/me to refresh user state. No
      // window.location.href reload (would unmount Capacitor's WebView).
      await Preferences.set({ key: 'auth_token', value: outcome.token });
      await Preferences.set({
        key: 'auth_expires',
        value: (Date.now() + outcome.expiresIn * 1000).toString(),
      });
      if (onSuccess) await onSuccess();
    };

    void onCallback(handle).then((remove) => {
      if (cancelled) {
        remove();
        return;
      }
      removeListener = remove;
    });

    void consumeLaunchCallback().then((params) => {
      if (cancelled || !params) return;
      void handle(params);
    });

    return () => {
      cancelled = true;
      if (removeListener) removeListener();
    };
  }, [onSuccess]);
}

export { NATIVE_REDIRECT_URI };
