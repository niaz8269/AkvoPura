/**
 * Salesman performance leaderboard helper.
 *
 * Computes per-salesman daily totals from the live CG + Pets providers
 * + AssignmentsProvider. Since the current mock setup attributes every
 * delivery / bill to "whichever salesman is assigned today" rather than
 * per-event, we group each provider's records under that day's assigned
 * salesman name. Real per-event attribution arrives with the backend.
 */

import type { User } from '../auth/types';
import type { DeliveryEntry, CollectionEntry } from '../cg/types';
import type { BillEntry, PetReturnEntry } from '../pets/types';

export type SalesmanLeaderboardRow = {
  user: User;
  type: 'pets' | 'cg';
  cashCollected: number;
  amountBilled: number;
  events: number;     // deliveries (CG) or bills (Pets)
  units: number;      // total units delivered (cans+gallons or packs)
  customers: number;  // unique customers served today
};

export function buildLeaderboard(input: {
  cgSalesman?: User;
  petsSalesman?: User;
  cgDeliveries: DeliveryEntry[];
  cgCollections: CollectionEntry[];
  petsBills: BillEntry[];
  petsReturns: PetReturnEntry[];
}): SalesmanLeaderboardRow[] {
  const rows: SalesmanLeaderboardRow[] = [];

  if (input.petsSalesman) {
    const cash = input.petsBills.reduce((s, b) => s + b.cashCollected, 0);
    const billed = input.petsBills.reduce((s, b) => s + b.amountBilled, 0);
    const units = input.petsBills.reduce(
      (s, b) => s + b.pet600Packs + b.pet1500Packs,
      0
    );
    const customers = new Set(input.petsBills.map((b) => b.customerId)).size;
    rows.push({
      user: input.petsSalesman,
      type: 'pets',
      cashCollected: cash,
      amountBilled: billed,
      events: input.petsBills.length,
      units,
      customers,
    });
  }

  if (input.cgSalesman) {
    const cash = input.cgDeliveries.reduce((s, d) => s + d.cashCollected, 0);
    const billed = input.cgDeliveries.reduce((s, d) => s + d.amountBilled, 0);
    const units = input.cgDeliveries.reduce(
      (s, d) => s + d.cansDelivered + d.gallonsDelivered,
      0
    );
    const customers = new Set(input.cgDeliveries.map((d) => d.customerId)).size;
    rows.push({
      user: input.cgSalesman,
      type: 'cg',
      cashCollected: cash,
      amountBilled: billed,
      events: input.cgDeliveries.length,
      units,
      customers,
    });
  }

  // Sort by cash collected (desc)
  return rows.sort((a, b) => b.cashCollected - a.cashCollected);
}
