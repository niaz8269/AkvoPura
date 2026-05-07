/**
 * CG Customers API.
 *
 * Server shape uses ISO date strings; the mobile CGCustomer type uses
 * a unix-millis number for lastActivityAt. We translate at the boundary
 * so the existing in-memory consumers don't have to change.
 */

import { apiRequest } from './client';
import type { CGCustomer, CGRoute, PaymentCycle } from '../cg/types';

export type ApiCGCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  branchSlug: string;
  route: CGRoute;
  paymentCycle: PaymentCycle;
  usualCans: number;
  usualGallons: number;
  emptyCansHeld: number;
  emptyGallonsHeld: number;
  outstandingDebt: number;
  pricePerCan: number;
  pricePerGallon: number;
  lastActivityAt: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Convert the API row into the in-memory CGCustomer the rest of the
 *  app already knows how to render. */
export function toCGCustomer(api: ApiCGCustomer): CGCustomer {
  return {
    id: api.id,
    name: api.name,
    phone: api.phone,
    address: api.address,
    route: api.route,
    paymentCycle: api.paymentCycle,
    usualCans: api.usualCans,
    usualGallons: api.usualGallons,
    emptyCansHeld: api.emptyCansHeld,
    emptyGallonsHeld: api.emptyGallonsHeld,
    outstandingDebt: api.outstandingDebt,
    pricePerCan: api.pricePerCan,
    pricePerGallon: api.pricePerGallon,
    lastActivityAt: api.lastActivityAt ? Date.parse(api.lastActivityAt) : undefined,
    notes: api.notes ?? undefined,
  };
}

export type ListFilter = {
  branchSlug?: string;
  includeInactive?: boolean;
};

export async function listCGCustomers(filter: ListFilter = {}): Promise<CGCustomer[]> {
  const params = new URLSearchParams();
  if (filter.branchSlug) params.set('branchSlug', filter.branchSlug);
  if (filter.includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  const rows = await apiRequest<ApiCGCustomer[]>(`/cg/customers${qs ? '?' + qs : ''}`);
  return rows.map(toCGCustomer);
}

/** Customer self-service: fetch the calling customer's own linked CG
 *  record (debt, empties held). Returns null if no CG order has ever
 *  been fulfilled for them. */
export async function getMyCGCustomer(): Promise<CGCustomer | null> {
  const row = await apiRequest<ApiCGCustomer | null>('/cg/customers/me');
  return row ? toCGCustomer(row) : null;
}

export type CreateCGCustomerInput = {
  name: string;
  phone: string;
  address: string;
  branchSlug: string;
  route: CGRoute;
  paymentCycle: PaymentCycle;
  pricePerCan: number;
  pricePerGallon: number;
  usualCans?: number;
  usualGallons?: number;
  notes?: string;
};

export async function createCGCustomer(input: CreateCGCustomerInput): Promise<CGCustomer> {
  const row = await apiRequest<ApiCGCustomer>('/cg/customers', {
    method: 'POST',
    body: input,
  });
  return toCGCustomer(row);
}

export type UpdateCGCustomerInput = Partial<{
  name: string;
  phone: string;
  address: string;
  route: CGRoute;
  paymentCycle: PaymentCycle;
  usualCans: number;
  usualGallons: number;
  pricePerCan: number;
  pricePerGallon: number;
  active: boolean;
  notes: string;
}>;

export async function updateCGCustomer(
  id: string,
  input: UpdateCGCustomerInput,
): Promise<CGCustomer> {
  const row = await apiRequest<ApiCGCustomer>(`/cg/customers/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toCGCustomer(row);
}

export async function chargeCGCustomerLoss(
  id: string,
  cans: number,
  gallons: number,
  totalCharge: number,
): Promise<CGCustomer> {
  const row = await apiRequest<ApiCGCustomer>(`/cg/customers/${id}/charge-loss`, {
    method: 'POST',
    body: { cans, gallons, totalCharge },
  });
  return toCGCustomer(row);
}
