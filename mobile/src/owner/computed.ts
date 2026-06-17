/**
 * useOwnerData — derive Owner-facing data from the existing providers.
 *
 * No new state — Timergara stats are computed live from CGSalesman + Pets +
 * Manager providers. Shergarh stats come from baked demo data until backend
 * lands. The audit log is recomputed each render from raw deliveries / bills /
 * returns / expenses; cheap because Slice 5 has hundreds of rows at most.
 */

import { useMemo } from 'react';

import { useCGSalesman } from '../cg/state';
import { usePetsSalesman } from '../pets/state';
import { useManager } from '../manager/state';
import { classifyChurn } from '../analytics/churn';
import { shergarhDemoSummary } from './demoData';
import type { AuditLogItem, BranchKey, BranchSummary } from './types';

export function useOwnerData() {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();
  const manager = useManager();

  const timergara = useMemo<BranchSummary>(() => {
    const cgCash = cg.deliveries.reduce((s, d) => s + d.cashCollected, 0);
    const petsCash = pets.bills.reduce((s, b) => s + b.cashCollected, 0);
    const cgBilled = cg.deliveries.reduce((s, d) => s + d.amountBilled, 0);
    const petsBilled = pets.bills.reduce((s, b) => s + b.amountBilled, 0);

    const cgDebt = cg.customers.reduce((s, c) => s + c.outstandingDebt, 0);
    const petsDebt = pets.customers.reduce((s, c) => s + c.outstandingDebt, 0);

    const cgInDebt = cg.customers.filter((c) => c.outstandingDebt > 0).length;
    const petsInDebt = pets.customers.filter((c) => c.outstandingDebt > 0).length;

    const isAtRisk = (lastActivityAt: number | undefined) => {
      const r = classifyChurn(lastActivityAt);
      return r === 'at_risk' || r === 'never';
    };
    const atRisk =
      cg.customers.filter((c) => isAtRisk(c.lastActivityAt)).length +
      pets.customers.filter((c) => isAtRisk(c.lastActivityAt)).length;

    const expenses = manager.expenses;
    const approved = expenses.filter((e) => e.status === 'approved');

    return {
      key: 'timergara',
      name: { en: 'Timergara', ur: '' },

      cashCollectedToday: cgCash + petsCash,
      amountBilledToday: cgBilled + petsBilled,

      petsBills: pets.bills.length,
      pet600PacksSold: pets.bills.reduce((s, b) => s + b.pet600Packs, 0),
      pet1500PacksSold: pets.bills.reduce((s, b) => s + b.pet1500Packs, 0),

      cgDeliveries: cg.deliveries.length,
      cansDelivered: cg.deliveries.reduce((s, d) => s + d.cansDelivered, 0),
      gallonsDelivered: cg.deliveries.reduce((s, d) => s + d.gallonsDelivered, 0),
      emptyCansCollected: cg.collections.reduce((s, c) => s + c.cansCollected, 0),
      emptyGallonsCollected: cg.collections.reduce((s, c) => s + c.gallonsCollected, 0),

      customerCount: cg.customers.length + pets.customers.length,
      customersInDebt: cgInDebt + petsInDebt,
      customersAtRisk: atRisk,
      totalDebt: cgDebt + petsDebt,

      pendingExpenses: expenses.filter((e) => e.status === 'pending').length,
      expensesApproved: approved.length,
      expensesRejected: expenses.filter((e) => e.status === 'rejected').length,
      forwardedToOwner: expenses.filter((e) => e.status === 'forwarded').length,
      expenseTotalApproved: approved.reduce((s, e) => s + e.amount, 0),
    };
  }, [cg, pets, manager]);

  const shergarh = shergarhDemoSummary;

  // Audit log — derived from live + decided records.
  const auditLog = useMemo<AuditLogItem[]>(() => {
    const items: AuditLogItem[] = [];

    cg.deliveries.forEach((d) => {
      const cust = cg.customerById(d.customerId);
      items.push({
        id: 'al-cgd-' + d.id,
        ts: d.timestamp,
        branch: 'timergara',
        kind: 'cg_delivery',
        actor: 'Cans/Gallons Salesman',
        summary: `Delivered ${d.cansDelivered} cans + ${d.gallonsDelivered} gallons → ${cust?.name ?? 'customer'}`,
        amount: d.amountBilled,
      });
    });

    cg.collections.forEach((c) => {
      const cust = cg.customerById(c.customerId);
      items.push({
        id: 'al-cgc-' + c.id,
        ts: c.timestamp,
        branch: 'timergara',
        kind: 'cg_collection',
        actor: 'Cans/Gallons Salesman',
        summary: `Collected ${c.cansCollected} cans + ${c.gallonsCollected} gallons ← ${cust?.name ?? 'customer'}`,
      });
    });

    pets.bills.forEach((b) => {
      const cust = pets.customerById(b.customerId);
      items.push({
        id: 'al-pb-' + b.id,
        ts: b.timestamp,
        branch: 'timergara',
        kind: 'pets_bill',
        actor: 'Pets Salesman',
        summary: `Sold ${b.pet600Packs} × 600ml + ${b.pet1500Packs} × 1.5L → ${cust?.name ?? 'customer'}`,
        amount: b.amountBilled,
      });
    });

    pets.returns.forEach((r) => {
      const cust = pets.customerById(r.customerId);
      items.push({
        id: 'al-pr-' + r.id,
        ts: r.timestamp,
        branch: 'timergara',
        kind: 'pets_return',
        actor: 'Pets Salesman',
        summary: `Refunded ${r.pet600Packs} × 600ml + ${r.pet1500Packs} × 1.5L ← ${cust?.name ?? 'customer'}`,
        amount: r.refundAmount,
      });
    });

    manager.expenses.forEach((e) => {
      // Submission event
      items.push({
        id: 'al-es-' + e.id,
        ts: e.submittedAt,
        branch: 'timergara',
        kind: 'expense_submitted',
        actor: e.submittedBy,
        summary: `Submitted ${e.category} expense: ${e.notes ?? '(no note)'}`,
        amount: e.amount,
      });

      // Decision event (if any)
      if (e.decidedAt && e.status !== 'pending') {
        const verb =
          e.status === 'approved' ? 'Approved' : e.status === 'rejected' ? 'Rejected' : 'Forwarded';
        const kind: AuditLogItem['kind'] =
          e.status === 'approved'
            ? 'expense_approved'
            : e.status === 'rejected'
              ? 'expense_rejected'
              : 'expense_forwarded';
        items.push({
          id: 'al-ed-' + e.id,
          ts: e.decidedAt,
          branch: 'timergara',
          kind,
          actor: 'Manager',
          summary: `${verb} ${e.category} expense from ${e.submittedBy}`,
          amount: e.amount,
        });
      }
    });

    return items.sort((a, b) => b.ts - a.ts);
  }, [cg, pets, manager]);

  return { timergara, shergarh, auditLog, manager };
}

/** Branch-key resolver for things like backgrounds / labels. */
export function branchLabel(key: BranchKey) {
  return key === 'timergara' ? 'Timergara' : 'Shergarh';
}
