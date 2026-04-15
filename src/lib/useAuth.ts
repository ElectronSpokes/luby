import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { api } from './api';
import { isNative } from './platform';

interface User {
  sub: string;
  email: string;
  name: string;
  preferred_username: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://10.0.110.27:3001';
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let socialLoginInitialized = false;
let initError: string | null = null;

// Lazy-load the plugin only on native (avoids web build issues)
async function getSocialLogin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  return SocialLogin;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Initialize Google Sign-In on native
    if (isNative() && !socialLoginInitialized && GOOGLE_WEB_CLIENT_ID) {
      socialLoginInitialized = true;
      getSocialLogin()
        .then((SocialLogin) =>
          SocialLogin.initialize({
            google: {
              webClientId: GOOGLE_WEB_CLIENT_ID,
            },
          })
        )
        .then(() => console.log('[Luby] Google Sign-In initialized'))
        .catch((e: unknown) => {
          initError = String(e);
          console.error('[Luby] Google init error:', e);
        });
    }
  }, [checkAuth]);

  const login = async () => {
    if (isNative()) {
      if (!GOOGLE_WEB_CLIENT_ID) {
        alert('Google Client ID not configured');
        return;
      }
      if (initError) {
        alert('Google init failed: ' + initError);
        return;
      }

      try {
        const SocialLogin = await getSocialLogin();
        const result = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['email', 'profile'],
          },
        });

        const idToken = (result as any).result?.idToken;
        if (!idToken) {
          alert('No ID token returned from Google. Result: ' + JSON.stringify(result).substring(0, 200));
          return;
        }

        // Exchange Google ID token for Luby JWT
        const res = await fetch(`${API_URL}/api/v1/auth/google-signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
          const err = await res.text();
          alert('API error: ' + err);
          return;
        }

        const data = (await res.json()) as { token: string; expiresIn: number };
        await Preferences.set({ key: 'auth_token', value: data.token });
        if (data.expiresIn) {
          const expiresAt = Date.now() + data.expiresIn * 1000;
          await Preferences.set({ key: 'auth_expires', value: expiresAt.toString() });
        }

        await checkAuth();
      } catch (e) {
        alert('Sign-in error: ' + String(e));
      }
    } else {
      window.location.href = api.getLoginUrl();
    }
  };

  const logout = async () => {
    if (isNative()) {
      try {
        const SocialLogin = await getSocialLogin();
        await SocialLogin.logout({ provider: 'google' });
      } catch {}
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_expires' });
      setUser(null);
    } else {
      window.location.href = api.getLogoutUrl();
    }
  };

  return { user, loading, login, logout, checkAuth };
}
