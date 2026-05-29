import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Browser } from '@capacitor/browser';
import { api } from './api';
import { isNative } from './platform';
import {
  useAuthentikDeepLink,
  AUTHORIZE_URL,
  CLIENT_ID,
  SCOPE,
  NATIVE_REDIRECT_URI,
} from '../hooks/useAuthentikDeepLink';
import { generateChallenge, persistChallenge } from './native/pkce';

interface User {
  sub: string;
  email: string;
  name: string;
  preferred_username: string;
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
  }, [checkAuth]);

  // Subscribe to native deep-link callback. On native, after Authentik
  // redirects to net.myluby.app://callback, the hook exchanges the code
  // for a Luby JWT (POST /auth/mobile-callback), stores it in Preferences,
  // then invokes checkAuth() to refresh user state. No-op on web.
  useAuthentikDeepLink(checkAuth);

  const login = async () => {
    if (isNative()) {
      try {
        const challenge = await generateChallenge();
        await persistChallenge(challenge);
        const authorizeUrl = new URL(AUTHORIZE_URL);
        authorizeUrl.searchParams.set('response_type', 'code');
        authorizeUrl.searchParams.set('client_id', CLIENT_ID);
        authorizeUrl.searchParams.set('redirect_uri', NATIVE_REDIRECT_URI);
        authorizeUrl.searchParams.set('scope', SCOPE);
        authorizeUrl.searchParams.set('state', challenge.state);
        authorizeUrl.searchParams.set('nonce', challenge.nonce);
        authorizeUrl.searchParams.set('code_challenge', challenge.challenge);
        authorizeUrl.searchParams.set('code_challenge_method', 'S256');
        await Browser.open({ url: authorizeUrl.toString() });
      } catch (e) {
        alert('Sign-in error: ' + String(e));
      }
    } else {
      window.location.href = api.getLoginUrl();
    }
  };

  const logout = async () => {
    if (isNative()) {
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_expires' });
      setUser(null);
    } else {
      window.location.href = api.getLogoutUrl();
    }
  };

  return { user, loading, login, logout, checkAuth };
}
