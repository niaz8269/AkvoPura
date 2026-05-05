/**
 * CustomerProvider — orders + complaints state for the customer portal.
 *
 * Scoped to the logged-in customer. In a real backend each customer's data
 * is filtered server-side; here we filter client-side by customerUserId.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { demoComplaints, demoOrders, productCatalog } from './demoData';
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

  ordersForUser: (userId: string) => CustomerOrder[];
  complaintsForUser: (userId: string) => Complaint[];
  subscriptionsForUser: (userId: string) => Subscription[];

  placeOrder: (input: PlaceOrderInput) => CustomerOrder;
  cancelOrder: (id: string) => void;
  fileComplaint: (input: FileComplaintInput) => Complaint;
  rateComplaint: (id: string, rating: number) => void;
  createSubscription: (input: CreateSubscriptionInput) => Subscription;
  cancelSubscription: (id: string) => void;
  /** Place an order right now from a subscription (manual run for demo). */
  runSubscriptionNow: (id: string) => CustomerOrder | null;

  // Manager-side workflow actions
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
  const [orders, setOrders] = useState<CustomerOrder[]>(demoOrders);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const ordersForUser = useCallback(
    (userId: string) => orders.filter((o) => o.customerUserId === userId),
    [orders]
  );

  const complaintsForUser = useCallback(
    (userId: string) => complaints.filter((c) => c.customerUserId === userId),
    [complaints]
  );

  const subscriptionsForUser = useCallback(
    (userId: string) => subscriptions.filter((s) => s.customerUserId === userId),
    [subscriptions]
  );

  const placeOrder = useCallback<State['placeOrder']>((input) => {
    const total = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const order: CustomerOrder = {
      id: nextId('o'),
      customerUserId: input.customerUserId,
      items: input.items,
      totalAmount: total,
      preferredTime: input.preferredTime,
      notes: input.notes,
      status: 'pending',
      placedAt: Date.now(),
      updatedAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  const cancelOrder = useCallback<State['cancelOrder']>((id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.status === 'pending'
          ? { ...o, status: 'cancelled', updatedAt: Date.now() }
          : o
      )
    );
  }, []);

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
        c.id === id && c.status === 'resolved' ? { ...c, rating } : c
      )
    );
  }, []);

  const assignOrder = useCallback<State['assignOrder']>((orderId, salesmanId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedSalesmanId: salesmanId,
              status: 'assigned',
              updatedAt: Date.now(),
            }
          : o
      )
    );
  }, []);

  const markInTransit = useCallback<State['markInTransit']>((orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && (o.status === 'assigned' || o.status === 'pending')
          ? { ...o, status: 'in_transit', updatedAt: Date.now() }
          : o
      )
    );
  }, []);

  const markDelivered = useCallback<State['markDelivered']>((orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.status !== 'delivered' && o.status !== 'cancelled'
          ? { ...o, status: 'delivered', updatedAt: Date.now() }
          : o
      )
    );
  }, []);

  const managerCancelOrder = useCallback<State['managerCancelOrder']>(
    (orderId, note) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId && o.status !== 'delivered' && o.status !== 'cancelled'
            ? { ...o, status: 'cancelled', managerNote: note, updatedAt: Date.now() }
            : o
        )
      );
    },
    []
  );

  const markComplaintInReview = useCallback<State['markComplaintInReview']>((id) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id && c.status === 'open' ? { ...c, status: 'in_review' } : c))
    );
  }, []);

  const resolveComplaint = useCallback<State['resolveComplaint']>((id) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id && c.status !== 'resolved'
          ? { ...c, status: 'resolved', resolvedAt: Date.now() }
          : c
      )
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
      prev.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
  }, []);

  const runSubscriptionNow = useCallback<State['runSubscriptionNow']>(
    (id) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub || !sub.active) return null;
      // Mint an order from the subscription, mark the run timestamp.
      const order: CustomerOrder = {
        id: nextId('o'),
        customerUserId: sub.customerUserId,
        items: sub.items,
        totalAmount: sub.totalAmount,
        notes: `From subscription · ${sub.frequency}${sub.notes ? ` · ${sub.notes}` : ''}`,
        status: 'pending',
        placedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setOrders((prev) => [order, ...prev]);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, lastRunAt: Date.now() } : s))
      );
      return order;
    },
    [subscriptions]
  );

  const value = useMemo<State>(
    () => ({
      orders,
      complaints,
      subscriptions,
      catalog: productCatalog,
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
      assignOrder,
      markInTransit,
      markDelivered,
      managerCancelOrder,
      markComplaintInReview,
      resolveComplaint,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerPortal(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomerPortal must be used inside <CustomerProvider>');
  return ctx;
}
