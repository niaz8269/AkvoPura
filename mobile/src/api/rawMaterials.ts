/**
 * Raw materials API.
 */

import { apiRequest } from './client';
import type { RawMaterial, RawMaterialId } from '../production/types';

export type ApiRawMaterial = {
  id: string;
  name: string;
  nameUr: string | null;
  currentStock: number;
  reorderThreshold: number;
  unit: 'pieces' | 'rolls';
  updatedAt: string;
};

export function toRawMaterial(api: ApiRawMaterial): RawMaterial {
  return {
    id: api.id as RawMaterialId,
    name: api.name,
    nameUr: api.nameUr ?? '',
    currentStock: api.currentStock,
    reorderThreshold: api.reorderThreshold,
    unit: api.unit,
  };
}

export async function listRawMaterials() {
  const rows = await apiRequest<ApiRawMaterial[]>('/raw-materials');
  return rows.map(toRawMaterial);
}

export type CreateRawMaterialInput = {
  name: string;
  unit: 'pieces' | 'rolls';
  currentStock?: number;
  reorderThreshold?: number;
  nameUr?: string;
};

export async function createRawMaterial(input: CreateRawMaterialInput) {
  const row = await apiRequest<ApiRawMaterial>('/raw-materials', {
    method: 'POST',
    body: input,
  });
  return toRawMaterial(row);
}

export async function receiveRawMaterial(id: string, units: number) {
  const row = await apiRequest<ApiRawMaterial>(`/raw-materials/${id}/receive`, {
    method: 'POST',
    body: { units },
  });
  return toRawMaterial(row);
}

export type UpdateRawMaterialInput = Partial<{
  name: string;
  nameUr: string;
  reorderThreshold: number;
}>;

export async function updateRawMaterial(id: string, input: UpdateRawMaterialInput) {
  const row = await apiRequest<ApiRawMaterial>(`/raw-materials/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toRawMaterial(row);
}
