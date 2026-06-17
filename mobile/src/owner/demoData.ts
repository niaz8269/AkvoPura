/**
 * Synthetic Shergarh stats for the Owner cross-branch demo.
 *
 * Real Shergarh data only exists once the backend lands and a Shergarh
 * salesman starts logging real activity. Until then, these baked numbers
 * make the comparison view meaningful.
 */

import type { BranchSummary } from './types';

export const shergarhDemoSummary: BranchSummary = {
  key: 'shergarh',
  name: { en: 'Shergarh', ur: ' ' },

  cashCollectedToday: 18_500,
  amountBilledToday: 24_300,

  petsBills: 8,
  pet600PacksSold: 22,
  pet1500PacksSold: 14,

  cgDeliveries: 12,
  cansDelivered: 36,
  gallonsDelivered: 28,
  emptyCansCollected: 24,
  emptyGallonsCollected: 19,

  customerCount: 18,
  customersInDebt: 5,
  customersAtRisk: 3,
  totalDebt: 12_300,

  pendingExpenses: 2,
  expensesApproved: 4,
  expensesRejected: 1,
  forwardedToOwner: 1,
  expenseTotalApproved: 4_800,
};
