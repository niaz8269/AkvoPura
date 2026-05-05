/**
 * AuthContext — global login state with persistence.
 *
 * The user is stored in AsyncStorage so the app remembers them across restarts.
 * `isLoading` is true while we restore the saved user on startup.
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

import { authenticate } from './mockUsers';
import type { User } from './types';

const STORAGE_KEY = '@akvopura/auth/user';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore saved user on app startup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          setUser(JSON.parse(raw) as User);
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
    const found = authenticate(identifier, password);
    if (!found) {
      return { ok: false, reason: 'invalid_credentials' };
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    setUser(found);
    return { ok: true };
  }, []);

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
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
