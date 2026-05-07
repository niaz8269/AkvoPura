/**
 * Subscriptions API.
 *
 * The backend stores subscriptions as cadence='weekly' + daysOfWeek (0..6).
 * The mobile UI uses a simpler shape with frequency='daily'|'weekly' +
 * single weekday. We translate at the boundary:
 *
 *   daily   -> daysOfWeek = [0,1,2,3,4,5,6]
 *   weekly  -> daysOfWeek = [weekday]
 *
 * On read-back we infer the UI shape: if all 7 days -> 'daily', otherwise
 * 'weekly' with the first day as the displayed weekday. (The customer can
 * always delete + recreate to change the day.)
 */

import { apiRequest } from './client';
import type {
  CustomerOrderItem,
  Subscription,
  SubscriptionFrequency,
} from '../customer/types';

export type ApiSubscription = {
  id: string;
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  items: CustomerOrderItem[];
  cadence: 'weekly';
  daysOfWeek: number[];
  preferredTime: string | null;
  notes: string | null;
  active: boolean;
  lastGeneratedOn: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toSubscription(api: ApiSubscription): Subscription {
  const allSeven =
    api.daysOfWeek.length === 7 &&
    [0, 1, 2, 3, 4, 5, 6].every((d) => api.daysOfWeek.includes(d));
  const frequency: SubscriptionFrequency = allSeven ? 'daily' : 'weekly';
  const weekday = frequency === 'weekly' ? api.daysOfWeek[0] : undefined;
  const totalAmount = api.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  return {
    id: api.id,
    customerUserId: api.customerUserId,
    items: api.items,
    totalAmount,
    frequency,
    weekday,
    notes: api.notes ?? undefined,
    active: api.active,
    // Approximation — backend tracks date (yyyy-mm-dd) of last gen, not
    // a timestamp. Parse to local-noon so it sorts/displays sanely.
    lastRunAt: api.lastGeneratedOn
      ? Date.parse(`${api.lastGeneratedOn}T12:00:00`)
      : null,
    createdAt: Date.parse(api.createdAt),
  };
}

/** Caller's own subscriptions (customer portal). */
export async function listMySubscriptions() {
  const rows = await apiRequest<ApiSubscription[]>('/subscriptions/mine');
  return rows.map(toSubscription);
}

export type CreateSubscriptionInput = {
  items: CustomerOrderItem[];
  frequency: SubscriptionFrequency;
  /** Required when frequency === 'weekly'. */
  weekday?: number;
  preferredTime?: string;
  notes?: string;
  branchSlug?: string;
};

export async function createSubscriptionApi(input: CreateSubscriptionInput) {
  const daysOfWeek =
    input.frequency === 'daily'
      ? [0, 1, 2, 3, 4, 5, 6]
      : [input.weekday ?? 1];
  const row = await apiRequest<ApiSubscription>('/subscriptions', {
    method: 'POST',
    body: {
      items: input.items,
      daysOfWeek,
      preferredTime: input.preferredTime,
      notes: input.notes,
      branchSlug: input.branchSlug,
    },
  });
  return toSubscription(row);
}

export type UpdateSubscriptionInput = {
  items?: CustomerOrderItem[];
  frequency?: SubscriptionFrequency;
  weekday?: number;
  preferredTime?: string;
  notes?: string;
  active?: boolean;
};

export async function updateSubscriptionApi(
  id: string,
  input: UpdateSubscriptionInput,
) {
  // Translate frequency/weekday → daysOfWeek if either is being changed.
  let daysOfWeek: number[] | undefined;
  if (input.frequency !== undefined) {
    daysOfWeek =
      input.frequency === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : [input.weekday ?? 1];
  } else if (input.weekday !== undefined) {
    daysOfWeek = [input.weekday];
  }
  const row = await apiRequest<ApiSubscription>(`/subscriptions/${id}`, {
    method: 'PATCH',
    body: {
      ...(input.items !== undefined ? { items: input.items } : {}),
      ...(daysOfWeek !== undefined ? { daysOfWeek } : {}),
      ...(input.preferredTime !== undefined
        ? { preferredTime: input.preferredTime }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  return toSubscription(row);
}

export async function deleteSubscriptionApi(id: string) {
  return apiRequest<{ ok: true }>(`/subscriptions/${id}`, { method: 'DELETE' });
}

/** Owner-only: manually trigger today's subscription order generation
 *  (same code path as the daily 6 AM cron). Idempotent. */
export async function runSubscriptionsCronApi() {
  return apiRequest<{ generatedOrderIds: string[]; count: number }>(
    '/subscriptions/run-now',
    { method: 'POST' },
  );
}
