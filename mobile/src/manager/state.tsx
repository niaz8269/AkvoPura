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
  decideExpense: (id: string, decision: Exclude<ExpenseStatus, 'pending'>, note?: string) => void;
  submitExpense: (input: SubmitExpenseInput) => Expense;
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

  const submitExpense = useCallback<State['submitExpense']>((input) => {
    const expense: Expense = {
      id: `e-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      submittedBy: input.submittedBy,
      submittedByRole: input.submittedByRole,
      category: input.category,
      amount: input.amount,
      notes: input.notes,
      status: 'pending',
      submittedAt: Date.now(),
    };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.status === 'pending'),
    [expenses]
  );

  const value = useMemo<State>(
    () => ({ expenses, pendingExpenses, decideExpense, submitExpense }),
    [expenses, pendingExpenses, decideExpense, submitExpense]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManager(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManager must be used inside <ManagerProvider>');
  return ctx;
}
