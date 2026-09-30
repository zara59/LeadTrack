import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.js';
import {
  TOKEN_STORAGE_KEY,
  UNAUTHORIZED_EVENT,
} from '../services/api.js';

/**
 * Auth context. Holds the signed-in user, the JWT and a simple state machine:
 *
 *   'loading'         -> restoring the token on startup, nothing to render yet
 *   'authenticated'   -> a valid session exists; protected routes may render
 *   'unauthenticated' -> no token (or it failed verification) -> show login
 *
 * The token lives in localStorage and is sent as `Authorization: Bearer` on
 * every authenticated API call via api.js. No refresh-token/expiry machinery:
 * an invalid or expired token clears the session on the next 401.
 */
const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [status, setStatus] = useState('loading');

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // A protected request returned 401 (api.js broadcasts it) -> the token is
  // invalid or expired, so drop the session. RequireAuth sends the user to
  // /login automatically once `status` flips.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  // Restore the session once on mount: verify the stored token against the API.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const data = await authService.fetchCurrentUser(stored);
        if (cancelled) return;
        setUser(data.user);
        setToken(stored);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await authService.loginAccount({ email, password });
      saveSession(data.token, data.user);
      return data.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await authService.registerAccount({ name, email, password });
      saveSession(data.token, data.user);
      return data.user;
    },
    [saveSession],
  );

  const value = useMemo(
    () => ({ user, token, status, login, register, logout }),
    [user, token, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}