import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

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

  const login = () => {
    window.location.href = api.getLoginUrl();
  };

  const logout = () => {
    window.location.href = api.getLogoutUrl();
  };

  return { user, loading, login, logout, checkAuth };
}
