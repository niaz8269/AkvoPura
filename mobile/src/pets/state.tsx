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
import { usePricing } from '../pricing/state';
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
  /** Bill-time price overrides (per pack). If omitted, falls back to priceFor(). */
  pricePet600?: number;
  pricePet1500?: number;
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
  /** Manager-only — start a new trip: increments trip number and reloads van. */
  startNewTrip: (pet600: number, pet1500: number) => void;
  /** Which trip the salesman is on right now. */
  currentTripNumber: number;
  resetDay: () => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function PetsSalesmanProvider({ children }: PropsWithChildren) {
  const { prices } = usePricing();
  const [customers, setCustomers] = useState<PetCustomer[]>(demoPetCustomers);
  const [vanLoad, setVanLoad] = useState<PetVanLoad>(initialPetVanLoad);
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [returns, setReturns] = useState<PetReturnEntry[]>([]);
  const [currentTripNumber, setCurrentTripNumber] = useState(1);

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

  // Customer-specific override wins; otherwise use the owner's current default
  // from PricingProvider (so editing prices in Owner Settings flows through here).
  const priceFor = useCallback<State['priceFor']>(
    (customer, productId) => {
      if (productId === 'pet600') {
        return customer.pricePet600 ?? prices.pet600;
      }
      return customer.pricePet1500 ?? prices.pet1500;
    },
    [prices]
  );

  const recordBill = useCallback<State['recordBill']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const unit600 = input.pricePet600 ?? priceFor(customer, 'pet600');
    const unit1500 = input.pricePet1500 ?? priceFor(customer, 'pet1500');
    const billed = input.pet600Packs * unit600 + input.pet1500Packs * unit1500;

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
      tripNumber: currentTripNumber,
      timestamp: Date.now(),
    };
    setBills((prev) => [...prev, entry]);
    return entry;
  }, [customers, priceFor, currentTripNumber]);

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
      tripNumber: currentTripNumber,
      timestamp: Date.now(),
    };
    setReturns((prev) => [...prev, entry]);
    return entry;
  }, [customers, priceFor, currentTripNumber]);

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

  const startNewTrip = useCallback<State['startNewTrip']>((pet600, pet1500) => {
    setCurrentTripNumber((n) => n + 1);
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
    setCurrentTripNumber(1);
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
      startNewTrip,
      currentTripNumber,
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
      startNewTrip,
      currentTripNumber,
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
