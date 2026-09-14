import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTokens, setTokens, clearTokens } from '../api/client';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // The backend doesn't have a GET /auth/me endpoint yet, so a silent
  // token refresh on relaunch can prove the session is valid without
  // giving us the user object back. hasSession tracks "we have a working
  // token" separately from "we know who this is," so relaunch doesn't
  // incorrectly bounce the user to the login screen.
  // TODO(backend): add GET /auth/me and hydrate `user` here instead.
  const [hasSession, setHasSession] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) return;
        const { accessToken } = await authApi.refresh(refreshToken);
        await setTokens({ accessToken });
        setHasSession(true);
      } catch {
        await clearTokens();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = async (phone, password) => {
    const data = await authApi.login({ phone, password });
    await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    setHasSession(true);
    return data.user;
  };

  const signup = async ({ name, phone, password, email }) => {
    const data = await authApi.signup({ name, phone, password, email });
    await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    setHasSession(true);
    return data.user;
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
    setHasSession(false);
  };

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: hasSession,
      login,
      signup,
      logout,
      setUser,
    }),
    [user, booting, hasSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
