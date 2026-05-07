/**
 * PetsSalesmanState — single source of truth for the Pets salesman's day.
 *
 * As of B-10 the customer list, bills, and returns are all backed by the
 * /pets/* endpoints. The provider boots from baked-in demo data so the
 * UI is usable offline, then refetches whenever a user logs in. Mutations
 * (addCustomer / recordBill / undoLastBill / recordReturn / undoLastReturn)
 * are optimistic locally and rolled back via refresh on failure.
 *
 * Van load is still local for now — it represents what's physically on
 * the van, which is set by the manager at trip-start; persisting it is
 * a later slice.
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

import { demoPetCustomers, initialPetVanLoad, petProducts } from './demoData';
import { usePricing } from '../pricing/state';
import { useAuth } from '../auth/AuthContext';
import {
  createPetCustomer,
  listPetCustomers,
} from '../api/petCustomers';
import {
  listPetBills,
  recordPetBill,
  todayLocal,
  undoPetBill,
} from '../api/petBills';
import {
  listPetReturns,
  recordPetReturn,
  undoPetReturn,
} from '../api/petReturns';
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
  /** Optional digital payment (Easypaisa / JazzCash / IBFT). */
  bankCollected?: number;
  paymentReference?: string;
  /** Bill-time price overrides (per pack). If omitted, falls back to priceFor(). */
  pricePet600?: number;
  pricePet1500?: number;
  /** Optional flat Rs discount applied to the subtotal. */
  discount?: number;
};

type ReturnInput = {
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  reason?: string;
};

type AddPetCustomerInput = Omit<
  PetCustomer,
  'id' | 'outstandingDebt' | 'lastActivityAt'
> & {
  /** Branch the customer belongs to. Defaults to the caller's branch. */
  branchSlug?: string;
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

  /** Add a new Pets customer (POSTs to backend). */
  addCustomer: (input: AddPetCustomerInput) => Promise<PetCustomer>;
  /** Force a fresh fetch of customers + today's activity. */
  refresh: () => Promise<void>;
  /** True while loading customers from the server. */
  loading: boolean;
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
  const { user } = useAuth();
  const [customers, setCustomers] = useState<PetCustomer[]>(demoPetCustomers);
  const [loading, setLoading] = useState(false);
  const [vanLoad, setVanLoad] = useState<PetVanLoad>(initialPetVanLoad);
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [returns, setReturns] = useState<PetReturnEntry[]>([]);
  const [currentTripNumber, setCurrentTripNumber] = useState(1);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const date = todayLocal();
      const [freshCustomers, todayBills, todayReturns] = await Promise.all([
        listPetCustomers(),
        listPetBills({ date, salesmanId: user.id }),
        listPetReturns({ date, salesmanId: user.id }),
      ]);
      setCustomers(freshCustomers);
      // Server returns most-recent-first; keep oldest-first for the UI.
      setBills([...todayBills].reverse());
      setReturns([...todayReturns].reverse());
    } catch {
      // offline — keep current in-memory state
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Re-fetch on user change.
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

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

  const addCustomer = useCallback<State['addCustomer']>(
    async (input) => {
      const branchSlug = input.branchSlug ?? user?.branch ?? 'timergara';
      const created = await createPetCustomer({
        name: input.name,
        phone: input.phone,
        address: input.address,
        area: input.area,
        branchSlug,
        pricePet600: input.pricePet600,
        pricePet1500: input.pricePet1500,
        notes: input.notes,
      });
      setCustomers((prev) => [...prev, created]);
      return created;
    },
    [user?.branch],
  );

  const recordBill = useCallback<State['recordBill']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const unit600 = input.pricePet600 ?? priceFor(customer, 'pet600');
    const unit1500 = input.pricePet1500 ?? priceFor(customer, 'pet1500');
    const subtotal = input.pet600Packs * unit600 + input.pet1500Packs * unit1500;
    const discount = Math.max(0, Math.min(subtotal, input.discount ?? 0));
    const billed = subtotal - discount;
    const bankCollected = Math.max(0, input.bankCollected ?? 0);
    const totalPaid = input.cashCollected + bankCollected;

    const tempId = nextId('b-pending');
    const entry: BillEntry = {
      id: tempId,
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      subtotal,
      discount,
      amountBilled: billed,
      cashCollected: input.cashCollected,
      bankCollected,
      paymentReference: input.paymentReference,
      tripNumber: currentTripNumber,
      timestamp: Date.now(),
    };

    // Optimistic local update.
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              outstandingDebt: Math.max(0, c.outstandingDebt + billed - totalPaid),
              lastActivityAt: Date.now(),
            }
          : c
      )
    );
    setVanLoad((prev) => ({
      pet600Packs: prev.pet600Packs - input.pet600Packs,
      pet1500Packs: prev.pet1500Packs - input.pet1500Packs,
    }));
    setBills((prev) => [...prev, entry]);

    // Sync with server.
    recordPetBill({
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      pricePet600: unit600,
      pricePet1500: unit1500,
      discount,
      cashCollected: input.cashCollected,
      bankCollected,
      paymentReference: input.paymentReference,
      tripNumber: currentTripNumber,
    })
      .then((real) => {
        setBills((prev) => prev.map((b) => (b.id === tempId ? real : b)));
      })
      .catch(() => {
        refresh();
      });

    return entry;
  }, [customers, priceFor, currentTripNumber, refresh]);

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
                c.outstandingDebt - last.amountBilled + last.cashCollected + last.bankCollected
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

    if (!last.id.startsWith('b-pending')) {
      undoPetBill(last.id).catch(() => {
        refresh();
      });
    }

    return last;
  }, [bills, refresh]);

  const recordReturn = useCallback<State['recordReturn']>((input) => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) return null;

    const unit600 = priceFor(customer, 'pet600');
    const unit1500 = priceFor(customer, 'pet1500');
    const refund =
      input.pet600Packs * unit600 + input.pet1500Packs * unit1500;

    const tempId = nextId('r-pending');
    const entry: PetReturnEntry = {
      id: tempId,
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      refundAmount: refund,
      reason: input.reason,
      tripNumber: currentTripNumber,
      timestamp: Date.now(),
    };

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
    setReturns((prev) => [...prev, entry]);

    recordPetReturn({
      customerId: customer.id,
      pet600Packs: input.pet600Packs,
      pet1500Packs: input.pet1500Packs,
      pricePet600: unit600,
      pricePet1500: unit1500,
      reason: input.reason,
      tripNumber: currentTripNumber,
    })
      .then((real) => {
        setReturns((prev) => prev.map((r) => (r.id === tempId ? real : r)));
      })
      .catch(() => {
        refresh();
      });

    return entry;
  }, [customers, priceFor, currentTripNumber, refresh]);

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

    if (!last.id.startsWith('r-pending')) {
      undoPetReturn(last.id).catch(() => {
        refresh();
      });
    }

    return last;
  }, [returns, refresh]);

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
      addCustomer,
      refresh,
      loading,
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
      addCustomer,
      refresh,
      loading,
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
