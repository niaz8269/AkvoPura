/**
 * Expenses API.
 */

import { apiRequest } from './client';
import type { Expense, ExpenseCategory, ExpenseStatus } from '../manager/types';
import type { Role } from '../auth/types';

export type ApiExpense = {
  id: string;
  branchSlug: string;
  submittedById: string;
  submittedByName: string;
  submittedByRole: Role;
  category: ExpenseCategory;
  amount: number;
  notes: string | null;
  status: ExpenseStatus;
  decisionNote: string | null;
  decidedById: string | null;
  submittedAt: string;
  decidedAt: string | null;
  updatedAt: string;
};

export function toExpense(api: ApiExpense): Expense {
  return {
    id: api.id,
    submittedBy: api.submittedByName,
    submittedByRole: api.submittedByRole as Expense['submittedByRole'],
    category: api.category,
    amount: api.amount,
    notes: api.notes ?? undefined,
    status: api.status,
    decisionNote: api.decisionNote ?? undefined,
    submittedAt: Date.parse(api.submittedAt),
    decidedAt: api.decidedAt ? Date.parse(api.decidedAt) : undefined,
  };
}

export type ListExpensesFilter = {
  branchSlug?: string;
  status?: ExpenseStatus;
};

export async function listExpenses(filter: ListExpensesFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.status) p.set('status', filter.status);
  const qs = p.toString();
  const rows = await apiRequest<ApiExpense[]>(`/expenses${qs ? '?' + qs : ''}`);
  return rows.map(toExpense);
}

/** The current user's own submitted expenses, regardless of status. */
export async function listMyExpenses() {
  const rows = await apiRequest<ApiExpense[]>('/expenses/mine');
  return rows.map(toExpense);
}

export type SubmitExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  notes?: string;
  branchSlug?: string;
};

export async function submitExpenseApi(input: SubmitExpenseInput) {
  const row = await apiRequest<ApiExpense>('/expenses', {
    method: 'POST',
    body: input,
  });
  return toExpense(row);
}

export type Decision = Exclude<ExpenseStatus, 'pending'>;

export async function decideExpenseApi(
  id: string,
  decision: Decision,
  decisionNote?: string,
) {
  const row = await apiRequest<ApiExpense>(`/expenses/${id}/decide`, {
    method: 'PATCH',
    body: { decision, decisionNote },
  });
  return toExpense(row);
}
