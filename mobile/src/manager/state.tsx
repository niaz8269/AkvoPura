/**
 * ManagerProvider — expense approval inbox state.
 *
 * Other manager-only data (production logs, customer CRUD, route mgmt) will
 * land here as those slices ship.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoExpenses } from './demoData';
import type { Expense, ExpenseStatus } from './types';

type State = {
  expenses: Expense[];
  pendingExpenses: Expense[];
  decideExpense: (id: string, decision: Exclude<ExpenseStatus, 'pending'>, note?: string) => void;
};

const Ctx = createContext<State | undefined>(undefined);

export function ManagerProvider({ children }: PropsWithChildren) {
  const [expenses, setExpenses] = useState<Expense[]>(demoExpenses);

  const decideExpense = useCallback<State['decideExpense']>((id, decision, note) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: decision, decisionNote: note, decidedAt: Date.now() }
          : e
      )
    );
  }, []);

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.status === 'pending'),
    [expenses]
  );

  const value = useMemo<State>(
    () => ({ expenses, pendingExpenses, decideExpense }),
    [expenses, pendingExpenses, decideExpense]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManager(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManager must be used inside <ManagerProvider>');
  return ctx;
}
