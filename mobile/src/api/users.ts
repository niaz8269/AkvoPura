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
  branch: Branch | null;
  linkedCgCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListUsersFilter = {
  branch?: Branch;
  role?: Role;
};

export function listUsers(filter: ListUsersFilter = {}) {
  const params = new URLSearchParams();
  if (filter.branch) params.set('branch', filter.branch);
  if (filter.role) params.set('role', filter.role);
  const qs = params.toString();
  return apiRequest<ApiUser[]>(`/users${qs ? '?' + qs : ''}`);
}
