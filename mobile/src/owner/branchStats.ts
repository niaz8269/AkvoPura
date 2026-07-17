/**
 * fetchBranchStats — computes a BranchSummary for a given branch slug by
 * pulling all the relevant records from the backend (each endpoint accepts
 * ?branchSlug for owner-scope queries).
 *
 * This replaces the old client-side compute-from-shared-providers path
 * that only worked for a single branch. Now every branch on the server can
 * be summarised independently.
 */

import { listCGDeliveries } from '../api/cgDeliveries';
import { listCGCollections } from '../api/cgCollections';
import { listCGCustomers } from '../api/cgCustomers';
import { listPetBills } from '../api/petBills';
import { listPetCustomers } from '../api/petCustomers';
import { listExpenses } from '../api/expenses';
import { classifyChurn } from '../analytics/churn';
import { isOwnerWithdrawal } from '../manager/types';
import type { BranchSummary } from './types';

export async function fetchBranchStats(
  slug: string,
  displayName: string,
): Promise<BranchSummary> {
  const [
    cgDeliveries,
    cgCollections,
    cgCustomers,
    petBills,
    petCustomers,
    expenses,
  ] = await Promise.all([
    listCGDeliveries({ branchSlug: slug }),
    listCGCollections({ branchSlug: slug }),
    listCGCustomers({ branchSlug: slug }),
    listPetBills({ branchSlug: slug }),
    listPetCustomers({ branchSlug: slug }),
    listExpenses({ branchSlug: slug }),
  ]);

  const cgCash = cgDeliveries.reduce((s, d) => s + d.cashCollected, 0);
  const petsCash = petBills.reduce((s, b) => s + b.cashCollected, 0);
  const cgBilled = cgDeliveries.reduce((s, d) => s + d.amountBilled, 0);
  const petsBilled = petBills.reduce((s, b) => s + b.amountBilled, 0);

  const cgDebt = cgCustomers.reduce((s, c) => s + c.outstandingDebt, 0);
  const petsDebt = petCustomers.reduce((s, c) => s + c.outstandingDebt, 0);

  const cgInDebt = cgCustomers.filter((c) => c.outstandingDebt > 0).length;
  const petsInDebt = petCustomers.filter((c) => c.outstandingDebt > 0).length;

  const isAtRisk = (lastActivityAt: number | undefined) => {
    const r = classifyChurn(lastActivityAt);
    return r === 'at_risk' || r === 'never';
  };
  const atRisk =
    cgCustomers.filter((c) => isAtRisk(c.lastActivityAt)).length +
    petCustomers.filter((c) => isAtRisk(c.lastActivityAt)).length;

  const approved = expenses.filter((e) => e.status === 'approved');
  const plantExpenseTotal = approved
    .filter((e) => !isOwnerWithdrawal(e.category))
    .reduce((s, e) => s + e.amount, 0);
  const ownerWithdrawalTotal = approved
    .filter((e) => isOwnerWithdrawal(e.category))
    .reduce((s, e) => s + e.amount, 0);

  return {
    key: slug,
    name: { en: displayName },

    cashCollectedToday: cgCash + petsCash,
    amountBilledToday: cgBilled + petsBilled,

    petsBills: petBills.length,
    pet600PacksSold: petBills.reduce((s, b) => s + b.pet600Packs, 0),
    pet1500PacksSold: petBills.reduce((s, b) => s + b.pet1500Packs, 0),

    cgDeliveries: cgDeliveries.length,
    cansDelivered: cgDeliveries.reduce((s, d) => s + d.cansDelivered, 0),
    gallonsDelivered: cgDeliveries.reduce((s, d) => s + d.gallonsDelivered, 0),
    emptyCansCollected: cgCollections.reduce((s, c) => s + c.cansCollected, 0),
    emptyGallonsCollected: cgCollections.reduce((s, c) => s + c.gallonsCollected, 0),

    customerCount: cgCustomers.length + petCustomers.length,
    customersInDebt: cgInDebt + petsInDebt,
    customersAtRisk: atRisk,
    totalDebt: cgDebt + petsDebt,

    pendingExpenses: expenses.filter((e) => e.status === 'pending').length,
    expensesApproved: approved.length,
    expensesRejected: expenses.filter((e) => e.status === 'rejected').length,
    forwardedToOwner: expenses.filter((e) => e.status === 'forwarded').length,
    expenseTotalApproved: plantExpenseTotal + ownerWithdrawalTotal,
    plantExpenseTotal,
    ownerWithdrawalTotal,
  };
}

/** Empty summary for a brand-new branch with no data yet. */
export function emptyBranchSummary(slug: string, displayName: string): BranchSummary {
  return {
    key: slug,
    name: { en: displayName },
    cashCollectedToday: 0,
    amountBilledToday: 0,
    petsBills: 0,
    pet600PacksSold: 0,
    pet1500PacksSold: 0,
    cgDeliveries: 0,
    cansDelivered: 0,
    gallonsDelivered: 0,
    emptyCansCollected: 0,
    emptyGallonsCollected: 0,
    customerCount: 0,
    customersInDebt: 0,
    customersAtRisk: 0,
    totalDebt: 0,
    pendingExpenses: 0,
    expensesApproved: 0,
    expensesRejected: 0,
    forwardedToOwner: 0,
    expenseTotalApproved: 0,
    plantExpenseTotal: 0,
    ownerWithdrawalTotal: 0,
  };
}
