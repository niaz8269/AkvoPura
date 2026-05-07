/**
 * AuthContext — global login state, backed by the real /auth/login API.
 *
 * On startup we restore a saved token from AsyncStorage and verify it
 * against /auth/me. If verification fails (token expired, user deleted,
 * server unreachable) the user is logged out locally.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { apiRequest, ApiError, setAuthToken } from '../api/client';
import type { User } from './types';

const TOKEN_KEY = '@akvopura/auth/token';
const USER_KEY = '@akvopura/auth/user';

type LoginResponse = {
  token: string;
  user: User & {
    branch: User['branch'] | null;
    linkedCgCustomerId: string | null;
    linkedPetCustomerId: string | null;
  };
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Server returns branch:null for owner — normalise to undefined for the
 *  existing User type which has branch optional. */
function normaliseUser(raw: LoginResponse['user']): User {
  return {
    id: raw.id,
    name: raw.name,
    identifier: raw.identifier,
    role: raw.role,
    branch: raw.branch ?? undefined,
    linkedCgCustomerId: raw.linkedCgCustomerId ?? undefined,
    linkedPetCustomerId: raw.linkedPetCustomerId ?? undefined,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app startup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [token, savedUserRaw] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (!token) return;

        // Optimistic restore from cache so the UI doesn't blink the login
        // screen on every cold start.
        if (savedUserRaw) {
          setAuthToken(token);
          if (!cancelled) setUser(JSON.parse(savedUserRaw) as User);
        }

        // Verify against the server in the background. If it 401s, drop
        // the local session. If the network is unreachable, keep the
        // cached user (offline-friendly).
        try {
          setAuthToken(token);
          const fresh = await apiRequest<LoginResponse['user']>('/auth/me');
          if (!cancelled) {
            const normalised = normaliseUser(fresh);
            setUser(normalised);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalised));
          }
        } catch (e: unknown) {
          if (e instanceof ApiError && e.status === 401) {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            setAuthToken(null);
            if (!cancelled) setUser(null);
          }
          // Network error → keep cached session.
        }
      } catch {
        // ignore — treat as logged out
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (identifier, password) => {
    try {
      const res = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { identifier: identifier.trim(), password },
        auth: false,
      });
      const normalised = normaliseUser(res.user);
      setAuthToken(res.token);
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, res.token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(normalised)),
      ]);
      setUser(normalised);
      return { ok: true };
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 401) return { ok: false, reason: 'invalid_credentials' };
        if (e.code === 'network_error') return { ok: false, reason: 'network_error' };
        return { ok: false, reason: e.code };
      }
      return { ok: false, reason: 'unknown_error' };
    }
  }, []);

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
