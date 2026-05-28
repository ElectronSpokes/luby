import { Preferences } from '@capacitor/preferences';

const VERIFIER_KEY = 'pkce_verifier';
const NONCE_KEY = 'pkce_nonce';
const STATE_KEY = 'pkce_state';

const VERIFIER_BYTES = 32;

export interface PkceChallenge {
  verifier: string;
  challenge: string;
  state: string;
  nonce: string;
}

export interface StoredChallenge {
  verifier: string;
  nonce: string;
  state: string;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const arr = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateChallenge(): Promise<PkceChallenge> {
  const random = new Uint8Array(VERIFIER_BYTES);
  crypto.getRandomValues(random);
  const verifier = base64UrlEncode(random.buffer);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return {
    verifier,
    challenge: base64UrlEncode(hash),
    state: crypto.randomUUID(),
    nonce: crypto.randomUUID(),
  };
}

export async function persistChallenge(c: PkceChallenge): Promise<void> {
  await Promise.all([
    Preferences.set({ key: VERIFIER_KEY, value: c.verifier }),
    Preferences.set({ key: NONCE_KEY, value: c.nonce }),
    Preferences.set({ key: STATE_KEY, value: c.state }),
  ]);
}

export async function consumeChallenge(): Promise<StoredChallenge | null> {
  const [{ value: verifier }, { value: nonce }, { value: state }] = await Promise.all([
    Preferences.get({ key: VERIFIER_KEY }),
    Preferences.get({ key: NONCE_KEY }),
    Preferences.get({ key: STATE_KEY }),
  ]);
  if (!verifier || !nonce || !state) return null;
  await clearChallenge();
  return { verifier, nonce, state };
}

export async function clearChallenge(): Promise<void> {
  await Promise.all([
    Preferences.remove({ key: VERIFIER_KEY }),
    Preferences.remove({ key: NONCE_KEY }),
    Preferences.remove({ key: STATE_KEY }),
  ]);
}
