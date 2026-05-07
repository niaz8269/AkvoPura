/**
 * Customer orders API.
 */

import { apiRequest } from './client';
import type { CustomerOrder, CustomerOrderItem, CustomerOrderStatus } from '../customer/types';

export type ApiCustomerOrder = {
  id: string;
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  items: CustomerOrderItem[];
  totalAmount: number;
  preferredTime: string | null;
  notes: string | null;
  status: CustomerOrderStatus;
  assignedSalesmanId: string | null;
  assignedSalesmanName: string | null;
  managerNote: string | null;
  placedAt: string;
  updatedAt: string;
  updatedById: string | null;
};

export function toCustomerOrder(api: ApiCustomerOrder): CustomerOrder {
  return {
    id: api.id,
    customerUserId: api.customerUserId,
    customerName: api.customerName,
    items: api.items,
    totalAmount: api.totalAmount,
    preferredTime: api.preferredTime ?? undefined,
    notes: api.notes ?? undefined,
    status: api.status,
    assignedSalesmanId: api.assignedSalesmanId ?? undefined,
    assignedSalesmanName: api.assignedSalesmanName ?? undefined,
    managerNote: api.managerNote ?? undefined,
    placedAt: Date.parse(api.placedAt),
    updatedAt: Date.parse(api.updatedAt),
  };
}

export type ListOrdersFilter = {
  branchSlug?: string;
  status?: CustomerOrderStatus;
};

/** Branch-scoped inbox (manager / owner / salesman). */
export async function listOrders(filter: ListOrdersFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.status) p.set('status', filter.status);
  const qs = p.toString();
  const rows = await apiRequest<ApiCustomerOrder[]>(`/orders${qs ? '?' + qs : ''}`);
  return rows.map(toCustomerOrder);
}

/** Caller's own orders (used by the customer portal). */
export async function listMyOrders() {
  const rows = await apiRequest<ApiCustomerOrder[]>('/orders/mine');
  return rows.map(toCustomerOrder);
}

export type PlaceOrderInput = {
  items: CustomerOrderItem[];
  preferredTime?: string;
  notes?: string;
  branchSlug?: string;
};

export async function placeOrderApi(input: PlaceOrderInput) {
  const row = await apiRequest<ApiCustomerOrder>('/orders', {
    method: 'POST',
    body: input,
  });
  return toCustomerOrder(row);
}

export type UpdateOrderInput = {
  status?: CustomerOrderStatus;
  assignedSalesmanId?: string;
  managerNote?: string;
};

export async function updateOrderApi(id: string, input: UpdateOrderInput) {
  const row = await apiRequest<ApiCustomerOrder>(`/orders/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return toCustomerOrder(row);
}

export type FulfillOrderInput = {
  cashCollected?: number;
  bankCollected?: number;
  paymentReference?: string;
  emptyCansCollected?: number;
  emptyGallonsCollected?: number;
  discount?: number;
};

/** Salesman fulfills an order: backend creates the matching delivery /
 *  bill records and marks the order delivered atomically. */
export async function fulfillOrderApi(id: string, input: FulfillOrderInput) {
  const row = await apiRequest<ApiCustomerOrder>(`/orders/${id}/fulfill`, {
    method: 'POST',
    body: input,
  });
  return toCustomerOrder(row);
}
