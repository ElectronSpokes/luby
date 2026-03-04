import { useState, useEffect, useCallback } from 'react';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { api } from './api';
import { isNative } from './platform';

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

    // Listen for auth events from deep link handler
    const handler = () => { checkAuth(); };
    window.addEventListener('luby:auth-changed', handler);
    return () => window.removeEventListener('luby:auth-changed', handler);
  }, [checkAuth]);

  const login = async () => {
    if (isNative()) {
      // Open system browser for Authentik login
      await Browser.open({ url: api.getLoginUrl(true) });
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
