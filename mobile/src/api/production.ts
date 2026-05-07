/**
 * Production batches API.
 */

import { apiRequest, ApiError } from './client';
import type { ProducedProduct, ProductionBatch } from '../production/types';

export type ApiProductionBatch = {
  id: string;
  branchSlug: string;
  product: ProducedProduct;
  unitsProduced: number;
  batchNumber: string;
  tdsPpm: number | null;
  phLevel: number | null;
  wastage: number;
  notes: string | null;
  loggedById: string;
  loggedByName: string;
  loggedAt: string;
};

export function toProductionBatch(api: ApiProductionBatch): ProductionBatch {
  return {
    id: api.id,
    branch: api.branchSlug as ProductionBatch['branch'],
    product: api.product,
    unitsProduced: api.unitsProduced,
    batchNumber: api.batchNumber,
    tdsPpm: api.tdsPpm ?? undefined,
    phLevel: api.phLevel ?? undefined,
    wastage: api.wastage,
    notes: api.notes ?? undefined,
    loggedBy: api.loggedByName,
    loggedAt: Date.parse(api.loggedAt),
  };
}

export type ListBatchesFilter = {
  branchSlug?: string;
  date?: string;
};

export async function listProductionBatches(filter: ListBatchesFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.date) p.set('date', filter.date);
  const qs = p.toString();
  const rows = await apiRequest<ApiProductionBatch[]>(
    `/production/batches${qs ? '?' + qs : ''}`,
  );
  return rows.map(toProductionBatch);
}

export type RecordBatchInput = {
  product: ProducedProduct;
  unitsProduced: number;
  batchNumber: string;
  tdsPpm?: number;
  phLevel?: number;
  wastage?: number;
  notes?: string;
  branchSlug?: string;
};

export async function recordProductionBatch(input: RecordBatchInput) {
  const row = await apiRequest<ApiProductionBatch>('/production/batches', {
    method: 'POST',
    body: input,
  });
  return toProductionBatch(row);
}

export async function undoProductionBatch(id: string) {
  const row = await apiRequest<ApiProductionBatch>(
    `/production/batches/${id}/undo`,
    { method: 'POST' },
  );
  return toProductionBatch(row);
}

export { ApiError };
