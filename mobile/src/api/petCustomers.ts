/**
 * Pets customers API.
 */

import { apiRequest } from './client';
import type { PetCustomer } from '../pets/types';

export type ApiPetCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  branchSlug: string;
  outstandingDebt: number;
  pricePet600: number | null;
  pricePet1500: number | null;
  lastActivityAt: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPetCustomer(api: ApiPetCustomer): PetCustomer {
  return {
    id: api.id,
    name: api.name,
    phone: api.phone,
    address: api.address,
    area: api.area,
    outstandingDebt: api.outstandingDebt,
    pricePet600: api.pricePet600 ?? undefined,
    pricePet1500: api.pricePet1500 ?? undefined,
    lastActivityAt: api.lastActivityAt ? Date.parse(api.lastActivityAt) : undefined,
    notes: api.notes ?? undefined,
  };
}

export type ListPetCustomersFilter = {
  branchSlug?: string;
  includeInactive?: boolean;
};

export async function listPetCustomers(filter: ListPetCustomersFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.includeInactive) p.set('includeInactive', 'true');
  const qs = p.toString();
  const rows = await apiRequest<ApiPetCustomer[]>(`/pets/customers${qs ? '?' + qs : ''}`);
  return rows.map(toPetCustomer);
}

export type CreatePetCustomerInput = {
  name: string;
  phone: string;
  address: string;
  area: string;
  branchSlug: string;
  pricePet600?: number;
  pricePet1500?: number;
  notes?: string;
};

export async function createPetCustomer(input: CreatePetCustomerInput) {
  const row = await apiRequest<ApiPetCustomer>('/pets/customers', {
    method: 'POST',
    body: input,
  });
  return toPetCustomer(row);
}

export type UpdatePetCustomerInput = Partial<{
  name: string;
  phone: string;
  address: string;
  area: string;
  pricePet600: number | null;
  pricePet1500: number | null;
  active: boolean;
  notes: string;
}>;

export async function updatePetCustomer(id: string, input: UpdatePetCustomerInput) {
  const row = await apiRequest<ApiPetCustomer>(`/pets/customers/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toPetCustomer(row);
}
