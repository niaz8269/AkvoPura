/**
 * Owner domain types — branch-summary shapes used across the Owner screens.
 *
 * The Owner sees aggregated numbers for each branch and a comparison view.
 * All branch data is fetched from the backend; branches themselves come
 * from the /branches endpoint (owner can add/edit via Manage Branches).
 */

/** Branch identifier — slug from the backend `branches` table. Was a
 *  hardcoded union pre-B-5; now any string the server accepts. */
export type BranchKey = string;

export type BranchSummary = {
  key: BranchKey;
  name: { en: string };

  // Sales
  cashCollectedToday: number;
  amountBilledToday: number;

  // Pets
  petsBills: number;
  pet600PacksSold: number;
  pet1500PacksSold: number;

  // Cans / Gallons
  cgDeliveries: number;
  cansDelivered: number;
  gallonsDelivered: number;
  emptyCansCollected: number;
  emptyGallonsCollected: number;

  // Customers
  customerCount: number;
  customersInDebt: number;
  customersAtRisk: number;
  totalDebt: number;

  // Expenses
  pendingExpenses: number;
  expensesApproved: number;
  expensesRejected: number;
  forwardedToOwner: number;
  /** Legacy: all approved expenses summed (kept for backwards display). */
  expenseTotalApproved: number;
  /** Approved expenses in plant categories (fuel, salary, repairs, etc.).
   *  These are true operational costs — deducted to compute plant profit. */
  plantExpenseTotal: number;
  /** Approved expenses in the "other" category — treated as owner
   *  withdrawals, not plant costs. Shown separately from plant profit. */
  ownerWithdrawalTotal: number;
};

export type AuditLogKind =
  | 'cg_delivery'
  | 'cg_collection'
  | 'pets_bill'
  | 'pets_return'
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'expense_forwarded';

export type AuditLogItem = {
  id: string;
  ts: number;
  branch: BranchKey;
  kind: AuditLogKind;
  actor: string;        // who did it (display name)
  summary: string;      // one-line description
  amount?: number;      // for monetary actions
};
