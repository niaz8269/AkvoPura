/**
 * Complaints API.
 */

import { apiRequest } from './client';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintComment,
  ComplaintRecipient,
  ComplaintStatus,
} from '../customer/types';

export type ApiComplaint = {
  id: string;
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  category: ComplaintCategory;
  recipient: ComplaintRecipient;
  description: string;
  status: ComplaintStatus;
  rating: number | null;
  filedAt: string;
  resolvedAt: string | null;
  decidedById: string | null;
  updatedAt: string;
};

export function toComplaint(api: ApiComplaint): Complaint {
  return {
    id: api.id,
    customerUserId: api.customerUserId,
    customerName: api.customerName,
    category: api.category,
    recipient: api.recipient,
    description: api.description,
    status: api.status,
    rating: api.rating ?? undefined,
    filedAt: Date.parse(api.filedAt),
    resolvedAt: api.resolvedAt ? Date.parse(api.resolvedAt) : undefined,
  };
}

export type ListComplaintsFilter = {
  branchSlug?: string;
  status?: ComplaintStatus;
};

export async function listComplaints(filter: ListComplaintsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.status) p.set('status', filter.status);
  const qs = p.toString();
  const rows = await apiRequest<ApiComplaint[]>(`/complaints${qs ? '?' + qs : ''}`);
  return rows.map(toComplaint);
}

export async function listMyComplaints() {
  const rows = await apiRequest<ApiComplaint[]>('/complaints/mine');
  return rows.map(toComplaint);
}

export type FileComplaintInput = {
  category: ComplaintCategory;
  recipient: ComplaintRecipient;
  description: string;
  branchSlug?: string;
};

export async function fileComplaintApi(input: FileComplaintInput) {
  const row = await apiRequest<ApiComplaint>('/complaints', {
    method: 'POST',
    body: input,
  });
  return toComplaint(row);
}

export type UpdateComplaintInput = {
  status?: ComplaintStatus;
  rating?: number;
};

export async function updateComplaintApi(id: string, input: UpdateComplaintInput) {
  const row = await apiRequest<ApiComplaint>(`/complaints/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toComplaint(row);
}

// ---- comments thread ----

export type ApiComplaintComment = {
  id: string;
  complaintId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  postedAt: string;
};

export function toComment(api: ApiComplaintComment): ComplaintComment {
  return {
    id: api.id,
    complaintId: api.complaintId,
    authorId: api.authorId,
    authorName: api.authorName,
    authorRole: api.authorRole,
    body: api.body,
    postedAt: Date.parse(api.postedAt),
  };
}

export async function listComplaintComments(complaintId: string) {
  const rows = await apiRequest<ApiComplaintComment[]>(`/complaints/${complaintId}/comments`);
  return rows.map(toComment);
}

export async function postComplaintComment(complaintId: string, body: string) {
  const row = await apiRequest<ApiComplaintComment>(`/complaints/${complaintId}/comments`, {
    method: 'POST',
    body: { body },
  });
  return toComment(row);
}
