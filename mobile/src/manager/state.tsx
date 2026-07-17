/**
 * ManagerProvider — expense approval inbox state, backed by /expenses.
 *
 * Boots from baked-in demo data so the UI works offline; refetches from
 * the server whenever the logged-in user changes. Submit and decide
 * mutations go through the API with optimistic local updates and
 * rollback-via-refresh on failure.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoExpenses } from './demoData';
import { useAuth } from '../auth/AuthContext';
import {
  decideExpenseApi,
  listExpenses,
  submitExpenseApi,
} from '../api/expenses';
import type { Expense, ExpenseCategory, ExpenseStatus } from './types';

type SubmitExpenseInput = {
  submittedBy: string;
  submittedByRole: Expense['submittedByRole'];
  category: ExpenseCategory;
  amount: number;
  notes?: string;
};

type State = {
  expenses: Expense[];
  pendingExpenses: Expense[];
  /** True while the initial fetch from /expenses is in flight. */
  loading: boolean;
  decideExpense: (
    id: string,
    decision: Exclude<ExpenseStatus, 'pending'>,
    note?: string,
  ) => void;
  submitExpense: (input: SubmitExpenseInput) => Promise<Expense>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function ManagerProvider({ children }: PropsWithChildren) {
  const { user, isImpersonating, effectiveBranch } = useAuth();
  // Boot empty; the real expense list comes from /expenses on mount.
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Owner-impersonating-manager: scope expenses to the impersonated
      // branch. Regular managers: server filters by their JWT branch.
      const fresh = await listExpenses(
        isImpersonating && effectiveBranch ? { branchSlug: effectiveBranch } : {},
      );
      setExpenses(fresh);
    } catch {
      // offline — keep current in-memory state
    } finally {
      setLoading(false);
    }
  }, [user, isImpersonating, effectiveBranch]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const decideExpense = useCallback<State['decideExpense']>(
    (id, decision, note) => {
      // Optimistic local update.
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: decision, decisionNote: note, decidedAt: Date.now() }
            : e,
        ),
      );

      // Skip the network call for in-memory demo rows that haven't been
      // synced to the server (no real id yet).
      if (id.startsWith('e-pending') || id.startsWith('exp-demo')) return;

      decideExpenseApi(id, decision, note)
        .then((real) => {
          setExpenses((prev) => prev.map((e) => (e.id === id ? real : e)));
        })
        .catch(() => {
          refresh();
        });
    },
    [refresh],
  );

  const submitExpense = useCallback<State['submitExpense']>(
    async (input) => {
      const tempId = nextId('e-pending');
      const optimistic: Expense = {
        id: tempId,
        submittedBy: input.submittedBy,
        submittedByRole: input.submittedByRole,
        category: input.category,
        amount: input.amount,
        notes: input.notes,
        status: 'pending',
        submittedAt: Date.now(),
      };
      setExpenses((prev) => [optimistic, ...prev]);

      try {
        const real = await submitExpenseApi({
          category: input.category,
          amount: input.amount,
          notes: input.notes,
        });
        setExpenses((prev) => prev.map((e) => (e.id === tempId ? real : e)));
        return real;
      } catch (e) {
        // Roll back the optimistic insert.
        setExpenses((prev) => prev.filter((x) => x.id !== tempId));
        throw e;
      }
    },
    [],
  );

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.status === 'pending'),
    [expenses],
  );

  const value = useMemo<State>(
    () => ({
      expenses,
      pendingExpenses,
      loading,
      decideExpense,
      submitExpense,
      refresh,
    }),
    [expenses, pendingExpenses, loading, decideExpense, submitExpense, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManager(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManager must be used inside <ManagerProvider>');
  return ctx;
}
