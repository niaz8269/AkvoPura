/**
 * TutorialProvider — tracks which roles have seen their first-login walkthrough.
 *
 * Per spec: "Onboarding tutorial the first time each role logs in, with
 * simple animations showing how to use the main features."
 *
 * State persisted in AsyncStorage so the tutorial only shows once per role
 * per device. The user can replay it from a "Show tutorial again" link in
 * each role's home area.
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

import type { Role } from '../auth/types';

const STORAGE_KEY = '@akvopura/tutorial/seenRoles';

type State = {
  /** Has the given role's tutorial been seen on this device? */
  hasSeen: (role: Role) => boolean;
  markSeen: (role: Role) => void;
  resetForRole: (role: Role) => void;
  /** Active tutorial flow — null means nothing is showing. */
  activeRole: Role | null;
  setActiveRole: (role: Role | null) => void;
};

const Ctx = createContext<State | undefined>(undefined);

export function TutorialProvider({ children }: PropsWithChildren) {
  const [seenRoles, setSeenRoles] = useState<Set<Role>>(new Set());
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const arr = JSON.parse(raw) as Role[];
          setSeenRoles(new Set(arr));
        }
      } catch {
        // ignore — empty set stands
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: Set<Role>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  }, []);

  const hasSeen = useCallback<State['hasSeen']>(
    (role) => loaded && seenRoles.has(role),
    [loaded, seenRoles]
  );

  const markSeen = useCallback<State['markSeen']>(
    (role) => {
      setSeenRoles((prev) => {
        const next = new Set(prev);
        next.add(role);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetForRole = useCallback<State['resetForRole']>(
    (role) => {
      setSeenRoles((prev) => {
        const next = new Set(prev);
        next.delete(role);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const value = useMemo<State>(
    () => ({ hasSeen, markSeen, resetForRole, activeRole, setActiveRole }),
    [hasSeen, markSeen, resetForRole, activeRole]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTutorial(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTutorial must be used inside <TutorialProvider>');
  return ctx;
}
