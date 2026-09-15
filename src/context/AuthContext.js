import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTokens, setTokens, clearTokens } from '../api/client';
import * as authApi from '../api/auth.api';
import * as usersApi from '../api/users.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // hasSession tracks "we have a working token" separately from "we know
  // who this is" (`user`), so a relaunch doesn't bounce the user to the
  // login screen just because hydrating their profile is still in flight.
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
        // Now that we have a valid access token, use it to find out who
        // it belongs to — this is the piece that used to be a TODO.
        const me = await usersApi.getMe();
        setUser(me);
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

  // Re-fetch the current user from the server and update context state —
  // used after a profile edit so the rest of the app (and a relaunch)
  // reflects the change without needing a full re-login.
  const refreshUser = async () => {
    const me = await usersApi.getMe();
    setUser(me);
    return me;
  };

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: hasSession,
      login,
      signup,
      logout,
      refreshUser,
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
