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

type State = {
  orders: CustomerOrder[];
  complaints: Complaint[];
  catalog: typeof productCatalog;

  ordersForUser: (userId: string) => CustomerOrder[];
  complaintsForUser: (userId: string) => Complaint[];

  placeOrder: (input: PlaceOrderInput) => CustomerOrder;
  cancelOrder: (id: string) => void;
  fileComplaint: (input: FileComplaintInput) => Complaint;
  rateComplaint: (id: string, rating: number) => void;

  // Manager-side workflow actions
  assignOrder: (orderId: string, salesmanId: string) => void;
  markInTransit: (orderId: string) => void;
  markDelivered: (orderId: string) => void;
  managerCancelOrder: (orderId: string, note?: string) => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function CustomerProvider({ children }: PropsWithChildren) {
  const [orders, setOrders] = useState<CustomerOrder[]>(demoOrders);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);

  const ordersForUser = useCallback(
    (userId: string) => orders.filter((o) => o.customerUserId === userId),
    [orders]
  );

  const complaintsForUser = useCallback(
    (userId: string) => complaints.filter((c) => c.customerUserId === userId),
    [complaints]
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

  const value = useMemo<State>(
    () => ({
      orders,
      complaints,
      catalog: productCatalog,
      ordersForUser,
      complaintsForUser,
      placeOrder,
      cancelOrder,
      fileComplaint,
      rateComplaint,
      assignOrder,
      markInTransit,
      markDelivered,
      managerCancelOrder,
    }),
    [
      orders,
      complaints,
      ordersForUser,
      complaintsForUser,
      placeOrder,
      cancelOrder,
      fileComplaint,
      rateComplaint,
      assignOrder,
      markInTransit,
      markDelivered,
      managerCancelOrder,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerPortal(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomerPortal must be used inside <CustomerProvider>');
  return ctx;
}
