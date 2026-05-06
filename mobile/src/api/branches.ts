/**
 * Branches API.
 */

import { apiRequest } from './client';

export type ApiBranch = {
  slug: string;
  name: string;
  nameUr: string | null;
  location: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function listBranches() {
  return apiRequest<ApiBranch[]>('/branches');
}

export type CreateBranchInput = {
  slug: string;
  name: string;
  nameUr?: string;
  location?: string;
};

export function createBranch(input: CreateBranchInput) {
  return apiRequest<ApiBranch>('/branches', { method: 'POST', body: input });
}

export type UpdateBranchInput = {
  name?: string;
  nameUr?: string;
  location?: string;
  active?: boolean;
};

export function updateBranch(slug: string, input: UpdateBranchInput) {
  return apiRequest<ApiBranch>(`/branches/${slug}`, {
    method: 'PATCH',
    body: input,
  });
}
