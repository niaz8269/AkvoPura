/**
 * PetsSalesmanState — single source of truth for the Pets salesman's day.
 *
 * Tracks: customers (with mutable debt), van load (Pet600/Pet1500 packs),
 * bills[], returns[]. In-memory only for Slice 3 — backend persistence later.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoPetCustomers, initialPetVanLoad, petProducts } from './demoData';
import type {
  BillEntry,
  PetCustomer,
  PetProduct,
  PetReturnEntry,
  PetVanLoad,
} from './types';

type BillInput = {
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  cashCollected: number;
};

type ReturnInput = {
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  reason?: string;
};

type State = {
  customers: PetCustomer[];
  products: PetProduct[];
  vanLoad: PetVanLoad;
  bills: BillEntry[];
  returns: PetReturnEntry[];

  customerById: (id: string) => PetCustomer | undefined;
  billsForCustomer: (id: string) => BillEntry[];
  returnsForCustomer: (id: string) => PetReturnEntry[];
  priceFor: (customer: PetCustomer, productId: PetProduct['id']) => number;

  recordBill: (input: BillInput) => BillEntry | null;
  undoLastBill: () => BillEntry | null;
  recordReturn: (input: ReturnInput) => PetReturnEntry | null;
  undoLastReturn: () => PetReturnEntry | null;
  /** Manager-only — set the packs loaded onto the salesman's van. */
  setVanPacks: (pet600: number, pet1500: number) => void;
  resetDay: () => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function PetsSalesmanProvider({ children }: PropsWithChildren) {
  const [customers, setCustomers] = useState<PetCustomer[]>(demoPetCustomers);
  const [vanLoad, setVanLoad] = useState<PetVanLoad>(initialPetVanLoad);
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [returns, setReturns] = useState<PetReturnEntry[]>([]);

  const customerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const billsForCustomer = useCallback(
    (id: string) => bills.filter((b) => b.customerId === id),
    [bills]
  );

  const returnsForCustomer = useCallback(
    (id: string) => returns.filter((r) => r.customerId === id),
    [returns]
  );

  const priceFor = useCallback<State['priceFor']>((customer, productId) => {
    if (productId === 'pet600') {
      return customer.pricePet600 ?? petProducts.find((p) => p.id === 'pet600')!.defaultPrice;
    }
    return customer.pricePet1500 ?? petProducts.find((p) => p.id === 'pet1500')!.defaultPrice;
  }, []);

  const recordBill = useCallback<State['recordBill']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const billed =
      input.pet600Packs * priceFor(customer, 'pet600') +
      input.pet1500Packs * priceFor(customer, 'pet1500');

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              outstandingDebt: Math.max(0, c.outstandingDebt + billed - input.cashCollected),
            }
          : c
      )
    );

    setVanLoad((prev) => ({
      pet600Packs: prev.pet600Packs - input.pet600Packs,
      pet1500Packs: prev.pet1500Packs - input.pet1500Packs,
    }));

    const entry: BillEntry = {
      id: nextId('b'),
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      amountBilled: billed,
      cashCollected: input.cashCollected,
      timestamp: Date.now(),
    };
    setBills((prev) => [...prev, entry]);
    return entry;
  }, [customers, priceFor]);

  const undoLastBill = useCallback<State['undoLastBill']>(() => {
    if (bills.length === 0) return null;
    const last = bills[bills.length - 1];

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === last.customerId
          ? {
              ...c,
              outstandingDebt: Math.max(
                0,
                c.outstandingDebt - last.amountBilled + last.cashCollected
              ),
            }
          : c
      )
    );
    setVanLoad((prev) => ({
      pet600Packs: prev.pet600Packs + last.pet600Packs,
      pet1500Packs: prev.pet1500Packs + last.pet1500Packs,
    }));
    setBills((prev) => prev.slice(0, -1));
    return last;
  }, [bills]);

  const recordReturn = useCallback<State['recordReturn']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const refund =
      input.pet600Packs * priceFor(customer, 'pet600') +
      input.pet1500Packs * priceFor(customer, 'pet1500');

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, outstandingDebt: Math.max(0, c.outstandingDebt - refund) }
          : c
      )
    );
    setVanLoad((prev) => ({
      pet600Packs: prev.pet600Packs + input.pet600Packs,
      pet1500Packs: prev.pet1500Packs + input.pet1500Packs,
    }));

    const entry: PetReturnEntry = {
      id: nextId('r'),
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      refundAmount: refund,
      reason: input.reason,
      timestamp: Date.now(),
    };
    setReturns((prev) => [...prev, entry]);
    return entry;
  }, [customers, priceFor]);

  const undoLastReturn = useCallback<State['undoLastReturn']>(() => {
    if (returns.length === 0) return null;
    const last = returns[returns.length - 1];

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === last.customerId
          ? { ...c, outstandingDebt: c.outstandingDebt + last.refundAmount }
          : c
      )
    );
    setVanLoad((prev) => ({
      pet600Packs: prev.pet600Packs - last.pet600Packs,
      pet1500Packs: prev.pet1500Packs - last.pet1500Packs,
    }));
    setReturns((prev) => prev.slice(0, -1));
    return last;
  }, [returns]);

  const setVanPacks = useCallback<State['setVanPacks']>((pet600, pet1500) => {
    setVanLoad({
      pet600Packs: Math.max(0, pet600),
      pet1500Packs: Math.max(0, pet1500),
    });
  }, []);

  const resetDay = useCallback(() => {
    setCustomers(demoPetCustomers);
    setVanLoad(initialPetVanLoad);
    setBills([]);
    setReturns([]);
  }, []);

  const value = useMemo<State>(
    () => ({
      customers,
      products: petProducts,
      vanLoad,
      bills,
      returns,
      customerById,
      billsForCustomer,
      returnsForCustomer,
      priceFor,
      recordBill,
      undoLastBill,
      recordReturn,
      undoLastReturn,
      setVanPacks,
      resetDay,
    }),
    [
      customers,
      vanLoad,
      bills,
      returns,
      customerById,
      billsForCustomer,
      returnsForCustomer,
      priceFor,
      recordBill,
      undoLastBill,
      recordReturn,
      undoLastReturn,
      setVanPacks,
      resetDay,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePetsSalesman(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePetsSalesman must be used inside <PetsSalesmanProvider>');
  return ctx;
}
