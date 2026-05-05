/**
 * Owner domain types — branch-summary shapes used across the Owner screens.
 *
 * The Owner sees aggregated numbers for each branch and a comparison view.
 * Real per-branch data comes from the live providers (Timergara) plus
 * synthetic stats for Shergarh until the backend lands.
 */

export type BranchKey = 'timergara' | 'shergarh';

export type BranchSummary = {
  key: BranchKey;
  name: { en: string; ur: string };

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
  expenseTotalApproved: number;
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
