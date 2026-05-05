/**
 * AssignmentsProvider — who is driving each van today.
 *
 * The Manager picks one Pets salesman + one Cans/Gallons salesman to assign
 * to today's vans. Salesmen see their assigned van's load on their app.
 *
 * In the current single-process mock setup any logged-in salesman sees the
 * shared mock state regardless of assignment — but the assignment is shown
 * everywhere it matters so the manager can demo the workflow. Real per-user
 * filtering ships with the backend.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { mockAccounts } from '../auth/mockUsers';
import type { Role, User } from '../auth/types';

type State = {
  petsSalesmanId: string | null;
  cgSalesmanId: string | null;
  setPetsSalesman: (id: string | null) => void;
  setCgSalesman: (id: string | null) => void;
  /** Look up the candidate salesmen for each role. */
  candidates: (role: Role) => User[];
  /** Resolve assigned salesman to user record (or undefined). */
  petsSalesman: () => User | undefined;
  cgSalesman: () => User | undefined;
};

const Ctx = createContext<State | undefined>(undefined);

function defaultPetsSalesmanId() {
  return mockAccounts.find((a) => a.user.role === 'pets_salesman')?.user.id ?? null;
}
function defaultCgSalesmanId() {
  return mockAccounts.find((a) => a.user.role === 'cans_gallons_salesman')?.user.id ?? null;
}

export function AssignmentsProvider({ children }: PropsWithChildren) {
  const [petsSalesmanId, setPetsSalesmanId] = useState<string | null>(defaultPetsSalesmanId());
  const [cgSalesmanId, setCgSalesmanId] = useState<string | null>(defaultCgSalesmanId());

  const candidates = useCallback<State['candidates']>((role) => {
    return mockAccounts.filter((a) => a.user.role === role).map((a) => a.user);
  }, []);

  const petsSalesman = useCallback<State['petsSalesman']>(
    () =>
      petsSalesmanId
        ? mockAccounts.find((a) => a.user.id === petsSalesmanId)?.user
        : undefined,
    [petsSalesmanId]
  );

  const cgSalesman = useCallback<State['cgSalesman']>(
    () =>
      cgSalesmanId
        ? mockAccounts.find((a) => a.user.id === cgSalesmanId)?.user
        : undefined,
    [cgSalesmanId]
  );

  const value = useMemo<State>(
    () => ({
      petsSalesmanId,
      cgSalesmanId,
      setPetsSalesman: setPetsSalesmanId,
      setCgSalesman: setCgSalesmanId,
      candidates,
      petsSalesman,
      cgSalesman,
    }),
    [petsSalesmanId, cgSalesmanId, candidates, petsSalesman, cgSalesman]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssignments(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAssignments must be used inside <AssignmentsProvider>');
  return ctx;
}
