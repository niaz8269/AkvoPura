/**
 * Pets returns API.
 */

import { apiRequest } from './client';
import type { PetReturnEntry } from '../pets/types';

export type ApiPetReturn = {
  id: string;
  customerId: string;
  salesmanId: string;
  branchSlug: string;
  pet600Packs: number;
  pet1500Packs: number;
  refundAmount: number;
  reason: string | null;
  tripNumber: number;
  loggedAt: string;
};

export function toReturnEntry(api: ApiPetReturn): PetReturnEntry {
  return {
    id: api.id,
    customerId: api.customerId,
    pet600Packs: api.pet600Packs,
    pet1500Packs: api.pet1500Packs,
    refundAmount: api.refundAmount,
    reason: api.reason ?? undefined,
    tripNumber: api.tripNumber,
    timestamp: Date.parse(api.loggedAt),
  };
}

export type ListPetReturnsFilter = {
  branchSlug?: string;
  salesmanId?: string;
  date?: string;
};

export async function listPetReturns(filter: ListPetReturnsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.salesmanId) p.set('salesmanId', filter.salesmanId);
  if (filter.date) p.set('date', filter.date);
  const qs = p.toString();
  const rows = await apiRequest<ApiPetReturn[]>(`/pets/returns${qs ? '?' + qs : ''}`);
  return rows.map(toReturnEntry);
}

/** Customer self-service: returns logged for the calling customer's
 *  linked Pets record. */
export async function listMyPetReturns() {
  const rows = await apiRequest<ApiPetReturn[]>('/pets/returns/mine');
  return rows.map(toReturnEntry);
}

export type RecordReturnInput = {
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  pricePet600: number;
  pricePet1500: number;
  reason?: string;
  tripNumber?: number;
  tripId: string;
};

export async function recordPetReturn(input: RecordReturnInput) {
  const row = await apiRequest<ApiPetReturn>('/pets/returns', {
    method: 'POST',
    body: input,
  });
  return toReturnEntry(row);
}

export async function undoPetReturn(id: string) {
  const row = await apiRequest<ApiPetReturn>(`/pets/returns/${id}/undo`, {
    method: 'POST',
  });
  return toReturnEntry(row);
}
