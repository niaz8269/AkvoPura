/**
 * Manager domain types — currently just expense approval workflow.
 *
 * Production tracking, customer CRUD, route mgmt, complaints, chat, and
 * order inbox come in later slices.
 */

export type ExpenseCategory =
  | 'fuel'
  | 'food'
  | 'repairs'
  | 'utilities'
  | 'salary'
  | 'raw_material'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'forwarded';

export type Expense = {
  id: string;
  /** Who submitted — usually a salesman, sometimes the manager themselves. */
  submittedBy: string;
  submittedByRole: 'pets_salesman' | 'cans_gallons_salesman' | 'manager';
  category: ExpenseCategory;
  amount: number;
  notes?: string;
  status: ExpenseStatus;
  /** Reason set when rejected. */
  decisionNote?: string;
  submittedAt: number;
  decidedAt?: number;
};
