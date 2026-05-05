/**
 * CGSalesmanState — single source of truth for the salesman's day.
 *
 * Holds: customers (with mutable balances), van load, deliveries[], collections[].
 * Resets to demo data on every app start in Slice 2 (no persistence yet — added
 * with backend in a later slice).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoCustomers, initialVanLoad } from './demoData';
import type {
  CGCustomer,
  CGRoute,
  CollectionEntry,
  DeliveryEntry,
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

type CGSalesmanState = {
  customers: CGCustomer[];
  vanLoad: VanLoad;
  deliveries: DeliveryEntry[];
  collections: CollectionEntry[];

  customerById: (id: string) => CGCustomer | undefined;
  customersByRoute: (route: CGRoute) => CGCustomer[];
  deliveriesForCustomer: (id: string) => DeliveryEntry[];
  collectionsForCustomer: (id: string) => CollectionEntry[];

  recordDelivery: (input: DeliveryInput) => DeliveryEntry | null;
  undoLastDelivery: () => DeliveryEntry | null;
  recordCollection: (input: CollectionInput) => void;
  undoLastCollection: () => CollectionEntry | null;
  /** Manager-only — set the filled-cans/gallons loaded onto the van. */
  setFilledLoad: (filledCans: number, filledGallons: number) => void;
  resetDay: () => void;
};

const Ctx = createContext<CGSalesmanState | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function CGSalesmanProvider({ children }: PropsWithChildren) {
  const [customers, setCustomers] = useState<CGCustomer[]>(demoCustomers);
  const [vanLoad, setVanLoad] = useState<VanLoad>(initialVanLoad);
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [collections, setCollections] = useState<CollectionEntry[]>([]);

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
      timestamp: Date.now(),
    };
    setDeliveries((prev) => [...prev, entry]);
    return entry;
  }, [customers]);

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
        timestamp: Date.now(),
      },
    ]);
  }, []);

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

  const resetDay = useCallback(() => {
    setCustomers(demoCustomers);
    setVanLoad(initialVanLoad);
    setDeliveries([]);
    setCollections([]);
  }, []);

  const value = useMemo<CGSalesmanState>(
    () => ({
      customers,
      vanLoad,
      deliveries,
      collections,
      customerById,
      customersByRoute,
      deliveriesForCustomer,
      collectionsForCustomer,
      recordDelivery,
      undoLastDelivery,
      recordCollection,
      undoLastCollection,
      setFilledLoad,
      resetDay,
    }),
    [
      customers,
      vanLoad,
      deliveries,
      collections,
      customerById,
      customersByRoute,
      deliveriesForCustomer,
      collectionsForCustomer,
      recordDelivery,
      undoLastDelivery,
      recordCollection,
      undoLastCollection,
      setFilledLoad,
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
