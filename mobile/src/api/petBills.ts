/**
 * Pets bills API.
 */

import { apiRequest } from './client';
import type { BillEntry } from '../pets/types';

export type ApiPetBill = {
  id: string;
  customerId: string;
  salesmanId: string;
  branchSlug: string;
  pet600Packs: number;
  pet1500Packs: number;
  subtotal: number;
  discount: number;
  amountBilled: number;
  cashCollected: number;
  bankCollected: number;
  paymentReference: string | null;
  tripNumber: number;
  loggedAt: string;
};

export function toBillEntry(api: ApiPetBill): BillEntry {
  return {
    id: api.id,
    customerId: api.customerId,
    pet600Packs: api.pet600Packs,
    pet1500Packs: api.pet1500Packs,
    subtotal: api.subtotal,
    discount: api.discount,
    amountBilled: api.amountBilled,
    cashCollected: api.cashCollected,
    bankCollected: api.bankCollected,
    paymentReference: api.paymentReference ?? undefined,
    tripNumber: api.tripNumber,
    timestamp: Date.parse(api.loggedAt),
  };
}

export type ListPetBillsFilter = {
  branchSlug?: string;
  salesmanId?: string;
  date?: string;
};

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function listPetBills(filter: ListPetBillsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.salesmanId) p.set('salesmanId', filter.salesmanId);
  if (filter.date) p.set('date', filter.date);
  const qs = p.toString();
  const rows = await apiRequest<ApiPetBill[]>(`/pets/bills${qs ? '?' + qs : ''}`);
  return rows.map(toBillEntry);
}

/** Customer self-service: bills logged for the calling customer's
 *  linked Pets record. */
export async function listMyPetBills() {
  const rows = await apiRequest<ApiPetBill[]>('/pets/bills/mine');
  return rows.map(toBillEntry);
}

export type RecordBillInput = {
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  pricePet600: number;
  pricePet1500: number;
  discount?: number;
  cashCollected: number;
  bankCollected?: number;
  paymentReference?: string;
  tripNumber?: number;
  tripId: string;
};

export async function recordPetBill(input: RecordBillInput) {
  const row = await apiRequest<ApiPetBill>('/pets/bills', {
    method: 'POST',
    body: input,
  });
  return toBillEntry(row);
}

export async function undoPetBill(id: string) {
  const row = await apiRequest<ApiPetBill>(`/pets/bills/${id}/undo`, {
    method: 'POST',
  });
  return toBillEntry(row);
}
