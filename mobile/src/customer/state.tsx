/**
 * CustomerProvider — orders + complaints + subscriptions state.
 *
 * All three are backed by Postgres now (B-15 orders, B-16 complaints,
 * B-18 subscriptions). The store keeps an in-memory mirror so screens
 * have something to render before the first network round-trip; on user
 * actions it does optimistic updates with refresh-on-failure rollback.
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

import { demoComplaints, demoOrders, productCatalog } from './demoData';
import { useAuth } from '../auth/AuthContext';
import {
  listOrders,
  placeOrderApi,
  updateOrderApi,
} from '../api/orders';
import {
  fileComplaintApi,
  listComplaints,
  updateComplaintApi,
} from '../api/complaints';
import {
  createSubscriptionApi,
  deleteSubscriptionApi,
  listMySubscriptions,
  updateSubscriptionApi,
} from '../api/subscriptions';
import { getMyCGCustomer } from '../api/cgCustomers';
import { listMyCGDeliveries } from '../api/cgDeliveries';
import { listMyCGCollections } from '../api/cgCollections';
import { getMyPetCustomer } from '../api/petCustomers';
import { listMyPetBills } from '../api/petBills';
import { listMyPetReturns } from '../api/petReturns';
import type { CGCustomer, CollectionEntry, DeliveryEntry } from '../cg/types';
import type { BillEntry, PetCustomer, PetReturnEntry } from '../pets/types';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintRecipient,
  CustomerOrder,
  CustomerOrderItem,
  Subscription,
  SubscriptionFrequency,
} from './types';

type PlaceOrderInput = {
  customerUserId: string;
  items: CustomerOrderItem[];
  preferredTime?: string;
  notes?: string;
};

type FileComplaintInput = {
  customerUserId: string;
  category: ComplaintCategory;
  recipient: ComplaintRecipient;
  description: string;
};

type CreateSubscriptionInput = {
  customerUserId: string;
  items: CustomerOrderItem[];
  frequency: SubscriptionFrequency;
  weekday?: number;
  notes?: string;
};

type State = {
  orders: CustomerOrder[];
  complaints: Complaint[];
  subscriptions: Subscription[];
  catalog: typeof productCatalog;
  ordersLoading: boolean;

  /** Customer self-service: the calling customer's own linked CG +
   *  Pets records and their bill / delivery / collection / return
   *  history. All come back from /me + /mine endpoints; null/[] when
   *  the customer hasn't had any orders fulfilled in that side yet. */
  myCgRecord: CGCustomer | null;
  myPetRecord: PetCustomer | null;
  myCgDeliveries: DeliveryEntry[];
  myCgCollections: CollectionEntry[];
  myPetBills: BillEntry[];
  myPetReturns: PetReturnEntry[];

  ordersForUser: (userId: string) => CustomerOrder[];
  complaintsForUser: (userId: string) => Complaint[];
  subscriptionsForUser: (userId: string) => Subscription[];

  placeOrder: (input: PlaceOrderInput) => Promise<CustomerOrder>;
  cancelOrder: (id: string) => void;
  fileComplaint: (input: FileComplaintInput) => Promise<Complaint>;
  rateComplaint: (id: string, rating: number) => void;
  createSubscription: (input: CreateSubscriptionInput) => Promise<Subscription>;
  /** Cancels by deleting the subscription. Past orders generated from
   *  it are preserved in the order history. */
  cancelSubscription: (id: string) => void;
  /** Place an order right now from a subscription (one-tap, ad-hoc). */
  runSubscriptionNow: (id: string) => Promise<CustomerOrder | null>;
  refreshOrders: () => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  /** Refresh the customer's own CG + Pets records + bills/deliveries.
   *  Called automatically after placeOrder + on first mount; the
   *  history screen also calls it on pull-to-refresh. */
  refreshMyData: () => Promise<void>;

  // Manager + salesman workflow actions
  assignOrder: (orderId: string, salesmanId: string) => void;
  markInTransit: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  managerCancelOrder: (orderId: string, note?: string) => void;
  markComplaintInReview: (id: string) => void;
  resolveComplaint: (id: string) => void;
};

const Ctx = createContext<State | undefined>(undefined);

export function CustomerProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>(demoOrders);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Customer self-service state — populated for customer-role users by
  // refreshMyData. Empty/null for non-customer roles.
  const [myCgRecord, setMyCgRecord] = useState<CGCustomer | null>(null);
  const [myPetRecord, setMyPetRecord] = useState<PetCustomer | null>(null);
  const [myCgDeliveries, setMyCgDeliveries] = useState<DeliveryEntry[]>([]);
  const [myCgCollections, setMyCgCollections] = useState<CollectionEntry[]>([]);
  const [myPetBills, setMyPetBills] = useState<BillEntry[]>([]);
  const [myPetReturns, setMyPetReturns] = useState<PetReturnEntry[]>([]);

  const refreshOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      // Backend scopes by role automatically:
      //  - customer → their own orders
      //  - manager  → branch
      //  - salesman → assigned ones
      //  - owner    → all
      const fresh = await listOrders();
      setOrders(fresh);
    } catch {
      // offline — keep current in-memory state
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  const refreshComplaints = useCallback(async () => {
    if (!user) return;
    try {
      // Same role-based scoping as orders.
      const fresh = await listComplaints();
      setComplaints(fresh);
    } catch {
      // offline — keep current in-memory state
    }
  }, [user]);

  const refreshSubscriptions = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const fresh = await listMySubscriptions();
      setSubscriptions(fresh);
    } catch {
      // offline — keep current in-memory state
    }
  }, [user]);

  const refreshMyData = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    // Fan out in parallel — six small endpoints, all branch-scoped
    // to this user. Tolerate partial failure: a 404 / network blip
    // for one shouldn't blank the whole screen.
    const settled = await Promise.allSettled([
      getMyCGCustomer(),
      getMyPetCustomer(),
      listMyCGDeliveries(),
      listMyCGCollections(),
      listMyPetBills(),
      listMyPetReturns(),
    ]);
    if (settled[0].status === 'fulfilled') setMyCgRecord(settled[0].value);
    if (settled[1].status === 'fulfilled') setMyPetRecord(settled[1].value);
    if (settled[2].status === 'fulfilled') setMyCgDeliveries(settled[2].value);
    if (settled[3].status === 'fulfilled') setMyCgCollections(settled[3].value);
    if (settled[4].status === 'fulfilled') setMyPetBills(settled[4].value);
    if (settled[5].status === 'fulfilled') setMyPetReturns(settled[5].value);
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshOrders();
      refreshComplaints();
      refreshSubscriptions();
      refreshMyData();
    }
  }, [user, refreshOrders, refreshComplaints, refreshSubscriptions, refreshMyData]);

  const ordersForUser = useCallback(
    (userId: string) => orders.filter((o) => o.customerUserId === userId),
    [orders],
  );

  const complaintsForUser = useCallback(
    (userId: string) => complaints.filter((c) => c.customerUserId === userId),
    [complaints],
  );

  const subscriptionsForUser = useCallback(
    (userId: string) => subscriptions.filter((s) => s.customerUserId === userId),
    [subscriptions],
  );

  const placeOrder = useCallback<State['placeOrder']>(
    async (input) => {
      const real = await placeOrderApi({
        items: input.items,
        preferredTime: input.preferredTime,
        notes: input.notes,
      });
      setOrders((prev) => [real, ...prev]);
      // Pull fresh balances + bill history in the background so the Home
      // and History screens reflect the new order on next render.
      refreshMyData();
      return real;
    },
    [refreshMyData],
  );

  const cancelOrder = useCallback<State['cancelOrder']>(
    (id) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id && o.status === 'pending'
            ? { ...o, status: 'cancelled', updatedAt: Date.now() }
            : o,
        ),
      );
      updateOrderApi(id, { status: 'cancelled' })
        .then((real) => {
          setOrders((prev) => prev.map((o) => (o.id === id ? real : o)));
        })
        .catch(() => {
          refreshOrders();
        });
    },
    [refreshOrders],
  );

  const fileComplaint = useCallback<State['fileComplaint']>(
    async (input) => {
      const real = await fileComplaintApi({
        category: input.category,
        recipient: input.recipient,
        description: input.description,
      });
      setComplaints((prev) => [real, ...prev]);
      return real;
    },
    [],
  );

  const rateComplaint = useCallback<State['rateComplaint']>(
    (id, rating) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id && c.status === 'resolved' ? { ...c, rating } : c,
        ),
      );
      updateComplaintApi(id, { rating })
        .then((real) => {
          setComplaints((prev) => prev.map((c) => (c.id === id ? real : c)));
        })
        .catch(() => {
          refreshComplaints();
        });
    },
    [refreshComplaints],
  );

  const optimisticUpdate = useCallback(
    (
      orderId: string,
      localPatch: (o: CustomerOrder) => CustomerOrder,
      remote: () => Promise<CustomerOrder>,
    ) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? localPatch(o) : o)));
      remote()
        .then((real) => {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? real : o)));
        })
        .catch(() => {
          refreshOrders();
        });
    },
    [refreshOrders],
  );

  const assignOrder = useCallback<State['assignOrder']>(
    (orderId, salesmanId) => {
      optimisticUpdate(
        orderId,
        (o) => ({
          ...o,
          assignedSalesmanId: salesmanId,
          status: 'assigned',
          updatedAt: Date.now(),
        }),
        () => updateOrderApi(orderId, { assignedSalesmanId: salesmanId }),
      );
    },
    [optimisticUpdate],
  );

  const markInTransit = useCallback<State['markInTransit']>(
    (orderId) => {
      optimisticUpdate(
        orderId,
        (o) =>
          o.status === 'assigned' || o.status === 'pending'
            ? { ...o, status: 'in_transit', updatedAt: Date.now() }
            : o,
        () => updateOrderApi(orderId, { status: 'in_transit' }),
      );
    },
    [optimisticUpdate],
  );

  const markDelivered = useCallback<State['markDelivered']>(
    (orderId) => {
      optimisticUpdate(
        orderId,
        (o) =>
          o.status !== 'delivered' && o.status !== 'cancelled'
            ? { ...o, status: 'delivered', updatedAt: Date.now() }
            : o,
        () => updateOrderApi(orderId, { status: 'delivered' }),
      );
    },
    [optimisticUpdate],
  );

  const managerCancelOrder = useCallback<State['managerCancelOrder']>(
    (orderId, note) => {
      optimisticUpdate(
        orderId,
        (o) =>
          o.status !== 'delivered' && o.status !== 'cancelled'
            ? { ...o, status: 'cancelled', managerNote: note, updatedAt: Date.now() }
            : o,
        () => updateOrderApi(orderId, { status: 'cancelled', managerNote: note }),
      );
    },
    [optimisticUpdate],
  );

  const markComplaintInReview = useCallback<State['markComplaintInReview']>(
    (id) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id && c.status === 'open' ? { ...c, status: 'in_review' } : c,
        ),
      );
      updateComplaintApi(id, { status: 'in_review' })
        .then((real) => {
          setComplaints((prev) => prev.map((c) => (c.id === id ? real : c)));
        })
        .catch(() => {
          refreshComplaints();
        });
    },
    [refreshComplaints],
  );

  const resolveComplaint = useCallback<State['resolveComplaint']>(
    (id) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id && c.status !== 'resolved'
            ? { ...c, status: 'resolved', resolvedAt: Date.now() }
            : c,
        ),
      );
      updateComplaintApi(id, { status: 'resolved' })
        .then((real) => {
          setComplaints((prev) => prev.map((c) => (c.id === id ? real : c)));
        })
        .catch(() => {
          refreshComplaints();
        });
    },
    [refreshComplaints],
  );

  const createSubscription = useCallback<State['createSubscription']>(
    async (input) => {
      const real = await createSubscriptionApi({
        items: input.items,
        frequency: input.frequency,
        weekday: input.weekday,
        notes: input.notes,
      });
      setSubscriptions((prev) => [real, ...prev]);
      return real;
    },
    [],
  );

  const cancelSubscription = useCallback<State['cancelSubscription']>(
    (id) => {
      // Optimistic remove
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      deleteSubscriptionApi(id).catch(() => {
        // Restore by refetching
        refreshSubscriptions();
      });
    },
    [refreshSubscriptions],
  );

  const runSubscriptionNow = useCallback<State['runSubscriptionNow']>(
    async (id) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub || !sub.active) return null;
      try {
        // "Run now" = place a one-off order with the same items. The
        // subscription itself is untouched (the cron will still run on
        // its scheduled days).
        const real = await placeOrderApi({
          items: sub.items,
          notes: `From subscription · ${sub.frequency}${sub.notes ? ` · ${sub.notes}` : ''}`,
        });
        setOrders((prev) => [real, ...prev]);
        // Optimistic lastRunAt bump for nicer UX. Backend doesn't track
        // ad-hoc runs (only cron-generated ones); refresh will overwrite
        // this on the next listSubscriptions if it doesn't match.
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, lastRunAt: Date.now() } : s)),
        );
        return real;
      } catch {
        return null;
      }
    },
    [subscriptions],
  );

  const value = useMemo<State>(
    () => ({
      orders,
      complaints,
      subscriptions,
      catalog: productCatalog,
      ordersLoading,
      myCgRecord,
      myPetRecord,
      myCgDeliveries,
      myCgCollections,
      myPetBills,
      myPetReturns,
      ordersForUser,
      complaintsForUser,
      subscriptionsForUser,
      placeOrder,
      cancelOrder,
      fileComplaint,
      rateComplaint,
      createSubscription,
      cancelSubscription,
      runSubscriptionNow,
      refreshOrders,
      refreshSubscriptions,
      refreshMyData,
      assignOrder,
      markInTransit,
      markDelivered,
      managerCancelOrder,
      markComplaintInReview,
      resolveComplaint,
    }),
    [
      orders,
      complaints,
      subscriptions,
      ordersLoading,
      myCgRecord,
      myPetRecord,
      myCgDeliveries,
      myCgCollections,
      myPetBills,
      myPetReturns,
      ordersForUser,
      complaintsForUser,
      subscriptionsForUser,
      placeOrder,
      cancelOrder,
      fileComplaint,
      rateComplaint,
      createSubscription,
      cancelSubscription,
      runSubscriptionNow,
      refreshOrders,
      refreshSubscriptions,
      refreshMyData,
      assignOrder,
      markInTransit,
      markDelivered,
      managerCancelOrder,
      markComplaintInReview,
      resolveComplaint,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerPortal(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomerPortal must be used inside <CustomerProvider>');
  return ctx;
}
