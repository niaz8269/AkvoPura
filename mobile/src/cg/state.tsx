/**
 * CGSalesmanState — single source of truth for the salesman's day.
 *
 * As of B-8 the customer list comes from the backend (/cg/customers).
 * It loads on user change, falls back to baked-in demo data when offline,
 * and pushes mutations (addCustomer / setPaymentCycle / chargeContainerLoss)
 * through the API. Deliveries and collections still mutate local state
 * only — they get their own endpoints in B-9.
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

import { demoCustomers, initialVanLoad } from './demoData';
import { useAuth } from '../auth/AuthContext';
import {
  chargeCGCustomerLoss,
  createCGCustomer,
  listCGCustomers,
  updateCGCustomer,
} from '../api/cgCustomers';
import type {
  CGCustomer,
  CGRoute,
  CollectionEntry,
  DeliveryEntry,
  PaymentCycle,
  VanLoad,
} from './types';

type DeliveryInput = {
  customerId: string;
  cansDelivered: number;
  gallonsDelivered: number;
  emptyCansCollected: number;
  emptyGallonsCollected: number;
  cashCollected: number;
};

type CollectionInput = {
  customerId: string;
  cansCollected: number;
  gallonsCollected: number;
};

type AddCustomerInput = Omit<
  CGCustomer,
  'id' | 'emptyCansHeld' | 'emptyGallonsHeld' | 'outstandingDebt' | 'lastActivityAt'
> & {
  /** Branch the customer belongs to. Defaults to the caller's branch. */
  branchSlug?: string;
};

type CGSalesmanState = {
  customers: CGCustomer[];
  vanLoad: VanLoad;
  deliveries: DeliveryEntry[];
  collections: CollectionEntry[];
  /** Which trip the salesman is on right now (1, 2, 3...). */
  currentTripNumber: number;

  customerById: (id: string) => CGCustomer | undefined;
  customersByRoute: (route: CGRoute) => CGCustomer[];
  deliveriesForCustomer: (id: string) => DeliveryEntry[];
  collectionsForCustomer: (id: string) => CollectionEntry[];

  /** Add a new customer (POST to backend). Returns the created record. */
  addCustomer: (input: AddCustomerInput) => Promise<CGCustomer>;
  /** Force a fresh fetch of customers from the server. */
  refreshCustomers: () => Promise<void>;
  /** True while loading customers from the server. */
  loading: boolean;
  recordDelivery: (input: DeliveryInput) => DeliveryEntry | null;
  undoLastDelivery: () => DeliveryEntry | null;
  recordCollection: (input: CollectionInput) => void;
  undoLastCollection: () => CollectionEntry | null;
  /** Manager-only — set the filled-cans/gallons loaded onto the van. */
  setFilledLoad: (filledCans: number, filledGallons: number) => void;
  /** Manager-only — start a new trip: increments trip number and reloads van. */
  startNewTrip: (filledCans: number, filledGallons: number) => void;
  /** Both manager and salesman can change a customer's payment cycle. */
  setPaymentCycle: (customerId: string, cycle: PaymentCycle) => void;
  /** Manager charges a customer for lost / damaged containers. The held
   *  empties are removed from the customer's record and the total charge
   *  added to their outstanding debt. */
  chargeContainerLoss: (
    customerId: string,
    cans: number,
    gallons: number,
    totalCharge: number
  ) => void;
  resetDay: () => void;
};

const Ctx = createContext<CGSalesmanState | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function CGSalesmanProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CGCustomer[]>(demoCustomers);
  const [loading, setLoading] = useState(false);
  const [vanLoad, setVanLoad] = useState<VanLoad>(initialVanLoad);
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [collections, setCollections] = useState<CollectionEntry[]>([]);

  const refreshCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await listCGCustomers();
      setCustomers(fresh);
    } catch {
      // Network down — keep current in-memory list (works offline).
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch customers whenever the logged-in user changes.
  useEffect(() => {
    if (user) refreshCustomers();
  }, [user, refreshCustomers]);
  const [currentTripNumber, setCurrentTripNumber] = useState(1);

  const customerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const customersByRoute = useCallback(
    (route: CGRoute) => customers.filter((c) => c.route === route),
    [customers]
  );

  const deliveriesForCustomer = useCallback(
    (id: string) => deliveries.filter((d) => d.customerId === id),
    [deliveries]
  );

  const collectionsForCustomer = useCallback(
    (id: string) => collections.filter((c) => c.customerId === id),
    [collections]
  );

  const addCustomer = useCallback<CGSalesmanState['addCustomer']>(
    async (input) => {
      const branchSlug = input.branchSlug ?? user?.branch ?? 'timergara';
      const created = await createCGCustomer({
        name: input.name,
        phone: input.phone,
        address: input.address,
        branchSlug,
        route: input.route,
        paymentCycle: input.paymentCycle,
        pricePerCan: input.pricePerCan,
        pricePerGallon: input.pricePerGallon,
        usualCans: input.usualCans,
        usualGallons: input.usualGallons,
        notes: input.notes,
      });
      setCustomers((prev) => [...prev, created]);
      return created;
    },
    [user?.branch],
  );

  const recordDelivery = useCallback<CGSalesmanState['recordDelivery']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const billed =
      input.cansDelivered * customer.pricePerCan +
      input.gallonsDelivered * customer.pricePerGallon;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id !== input.customerId
          ? c
          : {
              ...c,
              // Customer keeps the new filled containers (treated as empties they
              // will eventually return). Already-held empties picked up reduces.
              emptyCansHeld:
                c.emptyCansHeld + input.cansDelivered - input.emptyCansCollected,
              emptyGallonsHeld:
                c.emptyGallonsHeld +
                input.gallonsDelivered -
                input.emptyGallonsCollected,
              outstandingDebt: Math.max(
                0,
                c.outstandingDebt + billed - input.cashCollected
              ),
              lastActivityAt: Date.now(),
            }
      )
    );

    setVanLoad((prev) => ({
      filledCans: prev.filledCans - input.cansDelivered,
      filledGallons: prev.filledGallons - input.gallonsDelivered,
      emptyCansAboard: prev.emptyCansAboard + input.emptyCansCollected,
      emptyGallonsAboard: prev.emptyGallonsAboard + input.emptyGallonsCollected,
    }));

    const entry: DeliveryEntry = {
      id: nextId('d'),
      customerId: input.customerId,
      cansDelivered: input.cansDelivered,
      gallonsDelivered: input.gallonsDelivered,
      emptyCansCollected: input.emptyCansCollected,
      emptyGallonsCollected: input.emptyGallonsCollected,
      cashCollected: input.cashCollected,
      amountBilled: billed,
      tripNumber: currentTripNumber,
      timestamp: Date.now(),
    };
    setDeliveries((prev) => [...prev, entry]);
    return entry;
  }, [customers, currentTripNumber]);

  const undoLastDelivery = useCallback<CGSalesmanState['undoLastDelivery']>(() => {
    if (deliveries.length === 0) return null;
    const last = deliveries[deliveries.length - 1];

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== last.customerId) return c;
        return {
          ...c,
          emptyCansHeld:
            c.emptyCansHeld - last.cansDelivered + last.emptyCansCollected,
          emptyGallonsHeld:
            c.emptyGallonsHeld - last.gallonsDelivered + last.emptyGallonsCollected,
          outstandingDebt: Math.max(
            0,
            c.outstandingDebt - last.amountBilled + last.cashCollected
          ),
        };
      })
    );
    setVanLoad((prev) => ({
      filledCans: prev.filledCans + last.cansDelivered,
      filledGallons: prev.filledGallons + last.gallonsDelivered,
      emptyCansAboard: prev.emptyCansAboard - last.emptyCansCollected,
      emptyGallonsAboard: prev.emptyGallonsAboard - last.emptyGallonsCollected,
    }));
    setDeliveries((prev) => prev.slice(0, -1));
    return last;
  }, [deliveries]);

  const recordCollection = useCallback((input: CollectionInput) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== input.customerId) return c;
        return {
          ...c,
          emptyCansHeld: Math.max(0, c.emptyCansHeld - input.cansCollected),
          emptyGallonsHeld: Math.max(0, c.emptyGallonsHeld - input.gallonsCollected),
        };
      })
    );

    setVanLoad((prev) => ({
      ...prev,
      emptyCansAboard: prev.emptyCansAboard + input.cansCollected,
      emptyGallonsAboard: prev.emptyGallonsAboard + input.gallonsCollected,
    }));

    setCollections((prev) => [
      ...prev,
      {
        id: nextId('c'),
        customerId: input.customerId,
        cansCollected: input.cansCollected,
        gallonsCollected: input.gallonsCollected,
        tripNumber: currentTripNumber,
        timestamp: Date.now(),
      },
    ]);
  }, [currentTripNumber]);

  const undoLastCollection = useCallback<CGSalesmanState['undoLastCollection']>(() => {
    if (collections.length === 0) return null;
    const last = collections[collections.length - 1];

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== last.customerId) return c;
        return {
          ...c,
          emptyCansHeld: c.emptyCansHeld + last.cansCollected,
          emptyGallonsHeld: c.emptyGallonsHeld + last.gallonsCollected,
        };
      })
    );
    setVanLoad((prev) => ({
      ...prev,
      emptyCansAboard: prev.emptyCansAboard - last.cansCollected,
      emptyGallonsAboard: prev.emptyGallonsAboard - last.gallonsCollected,
    }));
    setCollections((prev) => prev.slice(0, -1));
    return last;
  }, [collections]);

  const setFilledLoad = useCallback<CGSalesmanState['setFilledLoad']>(
    (filledCans, filledGallons) => {
      setVanLoad((prev) => ({
        ...prev,
        filledCans: Math.max(0, filledCans),
        filledGallons: Math.max(0, filledGallons),
      }));
    },
    []
  );

  const setPaymentCycle = useCallback<CGSalesmanState['setPaymentCycle']>(
    (customerId, cycle) => {
      // Optimistic update; backend re-confirms.
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, paymentCycle: cycle } : c))
      );
      updateCGCustomer(customerId, { paymentCycle: cycle }).catch(() => {
        // Roll back on failure.
        refreshCustomers();
      });
    },
    [refreshCustomers]
  );

  const chargeContainerLoss = useCallback<CGSalesmanState['chargeContainerLoss']>(
    (customerId, cans, gallons, totalCharge) => {
      // Optimistic; if the server rejects we re-fetch to recover.
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                emptyCansHeld: Math.max(0, c.emptyCansHeld - cans),
                emptyGallonsHeld: Math.max(0, c.emptyGallonsHeld - gallons),
                outstandingDebt: c.outstandingDebt + Math.max(0, totalCharge),
              }
            : c
        )
      );
      chargeCGCustomerLoss(customerId, cans, gallons, totalCharge).catch(() => {
        refreshCustomers();
      });
    },
    [refreshCustomers]
  );

  const startNewTrip = useCallback<CGSalesmanState['startNewTrip']>(
    (filledCans, filledGallons) => {
      setCurrentTripNumber((n) => n + 1);
      setVanLoad((prev) => ({
        ...prev,
        filledCans: Math.max(0, filledCans),
        filledGallons: Math.max(0, filledGallons),
        // Empties stay on the van across trips — driver only off-loads them
        // back at the depot at end of day.
      }));
    },
    []
  );

  const resetDay = useCallback(() => {
    setCustomers(demoCustomers);
    setVanLoad(initialVanLoad);
    setDeliveries([]);
    setCollections([]);
    setCurrentTripNumber(1);
  }, []);

  const value = useMemo<CGSalesmanState>(
    () => ({
      customers,
      vanLoad,
      deliveries,
      collections,
      currentTripNumber,
      customerById,
      customersByRoute,
      deliveriesForCustomer,
      collectionsForCustomer,
      addCustomer,
      refreshCustomers,
      loading,
      recordDelivery,
      undoLastDelivery,
      recordCollection,
      undoLastCollection,
      setFilledLoad,
      startNewTrip,
      setPaymentCycle,
      chargeContainerLoss,
      resetDay,
    }),
    [
      customers,
      vanLoad,
      deliveries,
      collections,
      currentTripNumber,
      customerById,
      customersByRoute,
      deliveriesForCustomer,
      collectionsForCustomer,
      addCustomer,
      refreshCustomers,
      loading,
      recordDelivery,
      undoLastDelivery,
      recordCollection,
      undoLastCollection,
      setFilledLoad,
      startNewTrip,
      setPaymentCycle,
      chargeContainerLoss,
      resetDay,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCGSalesman(): CGSalesmanState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCGSalesman must be used inside <CGSalesmanProvider>');
  return ctx;
}
