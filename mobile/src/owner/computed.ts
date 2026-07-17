/**
 * useOwnerAuditLog — derives the cross-branch audit feed from the shared
 * providers (CG / Pets / Manager) that the logged-in owner sees.
 *
 * NOTE: pre-B-5 this hook also returned per-branch summaries. Those are
 * now fetched fresh per branch via `useAllBranchStats` / `useOneBranchStats`
 * in `useBranchList.ts`, so this module only owns the audit-log derivation.
 */

import { useMemo } from 'react';

import { useCGSalesman } from '../cg/state';
import { usePetsSalesman } from '../pets/state';
import { useManager } from '../manager/state';
import type { AuditLogItem, BranchKey } from './types';

export function useOwnerAuditLog(defaultBranch: BranchKey = 'timergara') {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();
  const manager = useManager();

  return useMemo<AuditLogItem[]>(() => {
    const items: AuditLogItem[] = [];

    cg.deliveries.forEach((d) => {
      const cust = cg.customerById(d.customerId);
      items.push({
        id: 'al-cgd-' + d.id,
        ts: d.timestamp,
        branch: defaultBranch,
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
        branch: defaultBranch,
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
        branch: defaultBranch,
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
        branch: defaultBranch,
        kind: 'pets_return',
        actor: 'Pets Salesman',
        summary: `Refunded ${r.pet600Packs} × 600ml + ${r.pet1500Packs} × 1.5L ← ${cust?.name ?? 'customer'}`,
        amount: r.refundAmount,
      });
    });

    manager.expenses.forEach((e) => {
      items.push({
        id: 'al-es-' + e.id,
        ts: e.submittedAt,
        branch: defaultBranch,
        kind: 'expense_submitted',
        actor: e.submittedBy,
        summary: `Submitted ${e.category} expense: ${e.notes ?? '(no note)'}`,
        amount: e.amount,
      });

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
          branch: defaultBranch,
          kind,
          actor: 'Manager',
          summary: `${verb} ${e.category} expense from ${e.submittedBy}`,
          amount: e.amount,
        });
      }
    });

    return items.sort((a, b) => b.ts - a.ts);
  }, [cg, pets, manager, defaultBranch]);
}

/** Human-readable label for a branch slug. Prefer the actual display name
 *  from the /branches API when you have it; falls back to a title-cased
 *  slug. */
export function branchLabel(key: BranchKey, fallback?: string) {
  if (fallback) return fallback;
  return key.charAt(0).toUpperCase() + key.slice(1);
}
