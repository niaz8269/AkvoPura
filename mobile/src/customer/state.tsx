/**
 * CustomerProvider — orders + complaints + subscriptions state.
 *
 * Orders are backed by the /orders endpoints (B-15). Complaints and
 * subscriptions still live in local state — they move to the backend
 * in the next slices.
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

  ordersForUser: (userId: string) => CustomerOrder[];
  complaintsForUser: (userId: string) => Complaint[];
  subscriptionsForUser: (userId: string) => Subscription[];

  placeOrder: (input: PlaceOrderInput) => Promise<CustomerOrder>;
  cancelOrder: (id: string) => void;
  fileComplaint: (input: FileComplaintInput) => Complaint;
  rateComplaint: (id: string, rating: number) => void;
  createSubscription: (input: CreateSubscriptionInput) => Subscription;
  cancelSubscription: (id: string) => void;
  /** Place an order right now from a subscription (manual run for demo). */
  runSubscriptionNow: (id: string) => Promise<CustomerOrder | null>;
  refreshOrders: () => Promise<void>;

  // Manager + salesman workflow actions
  assignOrder: (orderId: string, salesmanId: string) => void;
  markInTransit: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  managerCancelOrder: (orderId: string, note?: string) => void;
  markComplaintInReview: (id: string) => void;
  resolveComplaint: (id: string) => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function CustomerProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>(demoOrders);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

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

  useEffect(() => {
    if (user) refreshOrders();
  }, [user, refreshOrders]);

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
      return real;
    },
    [],
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

  const fileComplaint = useCallback<State['fileComplaint']>((input) => {
    const c: Complaint = {
      id: nextId('cp'),
      customerUserId: input.customerUserId,
      category: input.category,
      recipient: input.recipient,
      description: input.description,
      status: 'open',
      filedAt: Date.now(),
    };
    setComplaints((prev) => [c, ...prev]);
    return c;
  }, []);

  const rateComplaint = useCallback<State['rateComplaint']>((id, rating) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'resolved' ? { ...c, rating } : c,
      ),
    );
  }, []);

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

  const markComplaintInReview = useCallback<State['markComplaintInReview']>((id) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'open' ? { ...c, status: 'in_review' } : c,
      ),
    );
  }, []);

  const resolveComplaint = useCallback<State['resolveComplaint']>((id) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id && c.status !== 'resolved'
          ? { ...c, status: 'resolved', resolvedAt: Date.now() }
          : c,
      ),
    );
  }, []);

  const createSubscription = useCallback<State['createSubscription']>((input) => {
    const total = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const sub: Subscription = {
      id: nextId('s'),
      customerUserId: input.customerUserId,
      items: input.items,
      totalAmount: total,
      frequency: input.frequency,
      weekday: input.weekday,
      notes: input.notes,
      active: true,
      lastRunAt: null,
      createdAt: Date.now(),
    };
    setSubscriptions((prev) => [sub, ...prev]);
    return sub;
  }, []);

  const cancelSubscription = useCallback<State['cancelSubscription']>((id) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: false } : s)),
    );
  }, []);

  const runSubscriptionNow = useCallback<State['runSubscriptionNow']>(
    async (id) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub || !sub.active) return null;
      try {
        const real = await placeOrderApi({
          items: sub.items,
          notes: `From subscription · ${sub.frequency}${sub.notes ? ` · ${sub.notes}` : ''}`,
        });
        setOrders((prev) => [real, ...prev]);
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
