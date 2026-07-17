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
  | 'vehicle_maintenance'
  | 'plant_maintenance'
  | 'marketing'
  | 'rent'
  | 'insurance'
  | 'refreshments'
  | 'other';

/**
 * Categories that count as operational cost of running the plant.
 * These are deducted from revenue to compute plant profit.
 * "other" is excluded — it represents the owner's personal withdrawal.
 */
export const PLANT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'fuel',
  'food',
  'repairs',
  'utilities',
  'salary',
  'raw_material',
  'vehicle_maintenance',
  'plant_maintenance',
  'marketing',
  'rent',
  'insurance',
  'refreshments',
];

export function isOwnerWithdrawal(category: ExpenseCategory): boolean {
  return category === 'other';
}

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
