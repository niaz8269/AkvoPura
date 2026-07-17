/**
 * TripProvider — salesman's trip state (one active + N assigned).
 *
 * On mount fetches:
 *   - GET /trips/active   — the currently-open trip (or null)
 *   - GET /trips/assigned — prepared trips the manager assigned, oldest first
 *
 * Salesman flow:
 *   assigned[0] → tap Start → activeTrip; assigned shrinks by 1
 *   activeTrip  → tap End (with cash) → activeTrip = null; assigned unchanged
 *
 * Non-salesman roles don't fetch; hooks return empty state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import {
  endTrip as apiEndTrip,
  getActiveTrip,
  getAssignedTrips,
  startTrip as apiStartTrip,
  type ApiActiveTrip,
  type ApiTripSummary,
  type EndTripInput,
} from '../api/trips';

type Ctx = {
  activeTrip: ApiActiveTrip | null;
  assignedTrips: ApiTripSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Activate a specific prepared trip by id. */
  startTrip: (tripId: string) => Promise<ApiActiveTrip>;
  endTrip: (input: EndTripInput) => Promise<ApiActiveTrip>;
};

const TripContext = createContext<Ctx | undefined>(undefined);

const SALESMAN_ROLES = new Set(['cans_gallons_salesman', 'pets_salesman']);

export function TripProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const isSalesman = user ? SALESMAN_ROLES.has(user.role) : false;

  const [activeTrip, setActiveTrip] = useState<ApiActiveTrip | null>(null);
  const [assignedTrips, setAssignedTrips] = useState<ApiTripSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSalesman) {
      setActiveTrip(null);
      setAssignedTrips([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [trip, assigned] = await Promise.all([
        getActiveTrip(),
        getAssignedTrips(),
      ]);
      setActiveTrip(trip);
      setAssignedTrips(assigned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load trips';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isSalesman]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startTrip = useCallback<Ctx['startTrip']>(
    async (tripId) => {
      const trip = await apiStartTrip(tripId);
      setActiveTrip(trip);
      // The started trip drops out of assigned automatically since it's
      // now openedAt != null — refetch to keep the list clean.
      const assigned = await getAssignedTrips();
      setAssignedTrips(assigned);
      return trip;
    },
    [],
  );

  const endTrip = useCallback<Ctx['endTrip']>(
    async (input) => {
      if (!activeTrip) throw new Error('No active trip to end');
      const closed = await apiEndTrip(activeTrip.id, input);
      setActiveTrip(null);
      // Refetch in case another trip was queued in the meantime.
      const assigned = await getAssignedTrips();
      setAssignedTrips(assigned);
      return closed;
    },
    [activeTrip],
  );

  const value = useMemo<Ctx>(
    () => ({ activeTrip, assignedTrips, loading, error, refresh, startTrip, endTrip }),
    [activeTrip, assignedTrips, loading, error, refresh, startTrip, endTrip],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): Ctx {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside <TripProvider>');
  return ctx;
}
