/**
 * CG empty-collections API wrapper.
 */

import { apiRequest } from './client';
import type { CollectionEntry } from '../cg/types';

export type ApiCGCollection = {
  id: string;
  customerId: string;
  salesmanId: string;
  branchSlug: string;
  cansCollected: number;
  gallonsCollected: number;
  cashCollected: number;
  bankCollected: number;
  paymentReference: string | null;
  tripNumber: number;
  loggedAt: string;
};

export function toCollectionEntry(api: ApiCGCollection): CollectionEntry {
  return {
    id: api.id,
    customerId: api.customerId,
    cansCollected: api.cansCollected,
    gallonsCollected: api.gallonsCollected,
    cashCollected: api.cashCollected,
    bankCollected: api.bankCollected,
    paymentReference: api.paymentReference ?? undefined,
    tripNumber: api.tripNumber,
    timestamp: Date.parse(api.loggedAt),
  };
}

export type ListCollectionsFilter = {
  branchSlug?: string;
  salesmanId?: string;
  date?: string;
};

export async function listCGCollections(filter: ListCollectionsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.salesmanId) p.set('salesmanId', filter.salesmanId);
  if (filter.date) p.set('date', filter.date);
  const qs = p.toString();
  const rows = await apiRequest<ApiCGCollection[]>(`/cg/collections${qs ? '?' + qs : ''}`);
  return rows.map(toCollectionEntry);
}

/** Customer self-service: empties-collection visits for the calling
 *  customer's linked CG record. */
export async function listMyCGCollections() {
  const rows = await apiRequest<ApiCGCollection[]>('/cg/collections/mine');
  return rows.map(toCollectionEntry);
}

export type RecordCollectionInput = {
  customerId: string;
  cansCollected: number;
  gallonsCollected: number;
  cashCollected?: number;
  bankCollected?: number;
  paymentReference?: string;
  tripNumber?: number;
  tripId: string;
};

export async function recordCGCollection(input: RecordCollectionInput) {
  const row = await apiRequest<ApiCGCollection>('/cg/collections', {
    method: 'POST',
    body: input,
  });
  return toCollectionEntry(row);
}

export async function undoCGCollection(id: string) {
  const row = await apiRequest<ApiCGCollection>(`/cg/collections/${id}/undo`, {
    method: 'POST',
  });
  return toCollectionEntry(row);
}
