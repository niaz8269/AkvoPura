/**
 * Trips API wrapper — start, end, list, detail.
 *
 * Every delivery/bill/collection/return endpoint requires a tripId from
 * the salesman's currently-open trip. Server rejects with 400/409 if the
 * trip is closed or if a second start is attempted while one is open.
 */

import { apiRequest } from './client';

export type TripRole = 'cg' | 'pets';

export type ApiTripSummary = {
  id: string;
  salesmanId: string;
  salesman?: { id: string; name: string; role: string };
  branchSlug: string;
  role: TripRole;
  vehicleLabel: string;
  initialCansLoaded: number;
  initialGallonsLoaded: number;
  initialPet600Packs: number;
  initialPet1500Packs: number;
  finalCansOnVan: number | null;
  finalGallonsOnVan: number | null;
  finalEmptyCansOnVan: number | null;
  finalEmptyGallonsOnVan: number | null;
  finalPet600Packs: number | null;
  finalPet1500Packs: number | null;
  declaredCashOnHand: number | null;
  notes: string | null;
  /** When the manager assigned this trip. */
  preparedAt: string;
  preparedById: string | null;
  /** Null until the salesman actually starts the trip. */
  openedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
};

export type ApiActiveTrip = ApiTripSummary;

/** MANAGER: create a trip assignment for a salesman. */
export type PrepareTripInput = {
  salesmanId: string;
  role: TripRole;
  vehicleLabel: string;
  initialCansLoaded?: number;
  initialGallonsLoaded?: number;
  initialPet600Packs?: number;
  initialPet1500Packs?: number;
  notes?: string;
};

export type EndTripInput = {
  finalCansOnVan?: number;
  finalGallonsOnVan?: number;
  finalEmptyCansOnVan?: number;
  finalEmptyGallonsOnVan?: number;
  finalPet600Packs?: number;
  finalPet1500Packs?: number;
  declaredCashOnHand?: number;
  notes?: string;
};

export function getActiveTrip() {
  return apiRequest<ApiActiveTrip | null>('/trips/active');
}

/** SALESMAN: prepared trips assigned to me, oldest first. */
export function getAssignedTrips() {
  return apiRequest<ApiTripSummary[]>('/trips/assigned');
}

/** MANAGER: prepare (create) a trip assignment. */
export function prepareTrip(input: PrepareTripInput) {
  return apiRequest<ApiTripSummary>('/trips/prepare', { method: 'POST', body: input });
}

/** SALESMAN: activate a prepared trip. Zero data entry. */
export function startTrip(tripId: string) {
  return apiRequest<ApiTripSummary>(`/trips/${tripId}/start`, { method: 'POST', body: {} });
}

/** MANAGER: cancel a prepared trip (must not be started). */
export function cancelTrip(tripId: string, note?: string) {
  return apiRequest<ApiTripSummary>(`/trips/${tripId}/cancel`, {
    method: 'POST',
    body: note ? { note } : {},
  });
}

export function endTrip(tripId: string, input: EndTripInput) {
  return apiRequest<ApiTripSummary>(`/trips/${tripId}/end`, {
    method: 'PATCH',
    body: input,
  });
}

export type TripState = 'prepared' | 'active' | 'closed' | 'cancelled';

export type ListTripsFilter = {
  branchSlug?: string;
  salesmanId?: string;
  date?: string;
  state?: TripState;
};

export function listTrips(filter: ListTripsFilter = {}) {
  const p = new URLSearchParams();
  if (filter.branchSlug) p.set('branchSlug', filter.branchSlug);
  if (filter.salesmanId) p.set('salesmanId', filter.salesmanId);
  if (filter.date) p.set('date', filter.date);
  if (filter.state) p.set('state', filter.state);
  const qs = p.toString();
  return apiRequest<ApiTripSummary[]>(`/trips${qs ? '?' + qs : ''}`);
}

/** Detailed trip view — includes all activity records under this trip. */
export type ApiTripDetail = ApiTripSummary & {
  deliveries: Array<{
    id: string;
    customer: { id: string; name: string };
    cansDelivered: number;
    gallonsDelivered: number;
    emptyCansCollected: number;
    emptyGallonsCollected: number;
    cashCollected: number;
    bankCollected: number;
    amountBilled: number;
    loggedAt: string;
  }>;
  collections: Array<{
    id: string;
    customer: { id: string; name: string };
    cansCollected: number;
    gallonsCollected: number;
    cashCollected: number;
    bankCollected: number;
    loggedAt: string;
  }>;
  bills: Array<{
    id: string;
    customer: { id: string; name: string };
    pet600Packs: number;
    pet1500Packs: number;
    amountBilled: number;
    cashCollected: number;
    bankCollected: number;
    loggedAt: string;
  }>;
  returns: Array<{
    id: string;
    customer: { id: string; name: string };
    pet600Packs: number;
    pet1500Packs: number;
    refundAmount: number;
    loggedAt: string;
  }>;
  expenses: Array<{
    id: string;
    category: string;
    amount: number;
    notes: string | null;
    status: string;
    submittedByName: string;
    submittedAt: string;
  }>;
};

export function getTripDetail(tripId: string) {
  return apiRequest<ApiTripDetail>(`/trips/${tripId}`);
}
