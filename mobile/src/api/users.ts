/**
 * Users API — wraps the backend's /users endpoints.
 */

import { apiRequest } from './client';
import type { Role, Branch } from '../auth/types';

export type ApiUser = {
  id: string;
  identifier: string;
  name: string;
  role: Role;
  branchSlug: Branch | null;
  active: boolean;
  linkedCgCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListUsersFilter = {
  branchSlug?: Branch;
  role?: Role;
};

export function listUsers(filter: ListUsersFilter = {}) {
  const params = new URLSearchParams();
  if (filter.branchSlug) params.set('branchSlug', filter.branchSlug);
  if (filter.role) params.set('role', filter.role);
  const qs = params.toString();
  return apiRequest<ApiUser[]>(`/users${qs ? '?' + qs : ''}`);
}

export type CreateUserInput = {
  identifier: string;
  name: string;
  password: string;
  role: Role;
  branchSlug?: Branch;
  linkedCgCustomerId?: string;
};

export function createUser(input: CreateUserInput) {
  return apiRequest<ApiUser>('/users', { method: 'POST', body: input });
}

export type UpdateUserInput = {
  name?: string;
  role?: Role;
  branchSlug?: Branch | null;
  active?: boolean;
};

export function updateUser(id: string, input: UpdateUserInput) {
  return apiRequest<ApiUser>(`/users/${id}`, { method: 'PATCH', body: input });
}

export function resetUserPassword(id: string, newPassword: string) {
  return apiRequest<{ ok: true }>(`/users/${id}/reset-password`, {
    method: 'POST',
    body: { newPassword },
  });
}
