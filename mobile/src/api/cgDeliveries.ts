/**
 * CG deliveries API wrapper.
 *
 * The server returns ISO timestamps; we translate to unix-ms in the
 * existing DeliveryEntry shape so consumers don't change.
 */

import { apiRequest } from './client';
import type { DeliveryEntry } from '../cg/types';

export type ApiCGDelivery = {
  id: string;
  customerId: string;
  salesmanId: string;
  branchSlug: string;
  cansDelivered: number;
  gallonsDelivered: number;
  emptyCansCollected: number;
  emptyGallonsCollected: number;
  cashCollected: number;
  amountBilled: number;
  tripNumber: number;
  loggedAt: string;
};

export function toDeliveryEntry(api: ApiCGDelivery): DeliveryEntry {
  return {
    id: api.id,
    customerId: api.customerId,
    cansDelivered: api.cansDelivered,
    gallonsDelivered: api.gallonsDelivered,
    emptyCansCollected: api.emptyCansCollected,
    emptyGallonsCollected: api.emptyGallonsCollected,
    cashCollected: api.cashCollected,
    amountBilled: api.amountBilled,
    tripNumber: api.tripNumber,
    timestamp: Date.parse(api.loggedAt),
  };
}

export type ListDeliveriesFilter = {
  branchSlug?: string;
  salesmanId?: string;
  /** YYYY-MM-DD. */
  date?: string;
};

/** Local-time YYYY-MM-DD for "today". */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function listCGDeliveries(filter: ListDeliveriesFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.salesmanId) p.set('salesmanId', filter.salesmanId);
  if (filter.date) p.set('date', filter.date);
  const qs = p.toString();
  const rows = await apiRequest<ApiCGDelivery[]>(`/cg/deliveries${qs ? '?' + qs : ''}`);
  return rows.map(toDeliveryEntry);
}

export type RecordDeliveryInput = {
  customerId: string;
  cansDelivered: number;
  gallonsDelivered: number;
  emptyCansCollected: number;
  emptyGallonsCollected: number;
  cashCollected: number;
  tripNumber?: number;
};

export async function recordCGDelivery(input: RecordDeliveryInput) {
  const row = await apiRequest<ApiCGDelivery>('/cg/deliveries', {
    method: 'POST',
    body: input,
  });
  return toDeliveryEntry(row);
}

export async function undoCGDelivery(id: string) {
  const row = await apiRequest<ApiCGDelivery>(`/cg/deliveries/${id}/undo`, {
    method: 'POST',
  });
  return toDeliveryEntry(row);
}
