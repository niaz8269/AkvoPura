/**
 * Customer-portal domain types.
 *
 * Orders are placed by customers; deliveries (in CG/Pets state) are the
 * salesman's fulfilment of orders. They're separate concepts — an order
 * is a request, a delivery is the action.
 */

export type CustomerOrderStatus =
  | 'pending'        // just placed, manager hasn't seen yet
  | 'assigned'       // manager assigned a salesman
  | 'in_transit'     // salesman is on the way
  | 'delivered'      // delivered (linked to a delivery/bill record in real backend)
  | 'cancelled';

export type CustomerOrderItem = {
  /** Maps onto either a CG product or a Pets product. */
  productId: 'cans' | 'gallons' | 'pet600' | 'pet1500';
  qty: number;
  unitPrice: number;
};

export type CustomerOrder = {
  id: string;
  customerUserId: string;     // who placed it
  /** Display name snapshot at order time. */
  customerName?: string;
  items: CustomerOrderItem[];
  totalAmount: number;
  preferredTime?: string;     // free text from the customer ("by 6 PM today")
  notes?: string;
  status: CustomerOrderStatus;
  /** Salesman the manager assigned this to. Null until assigned. */
  assignedSalesmanId?: string;
  /** Salesman display name snapshot at assign time. */
  assignedSalesmanName?: string;
  /** Optional manager note (e.g., reason for cancellation). */
  managerNote?: string;
  placedAt: number;
  updatedAt: number;
};

export type SubscriptionFrequency = 'daily' | 'weekly';

export type Subscription = {
  id: string;
  customerUserId: string;
  items: CustomerOrderItem[];
  totalAmount: number;
  frequency: SubscriptionFrequency;
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday. Only used for weekly. */
  weekday?: number;
  notes?: string;
  active: boolean;
  /** Last time the recurring order was created from this subscription. */
  lastRunAt: number | null;
  createdAt: number;
};

export type ComplaintCategory =
  | 'delivery'
  | 'product_quality'
  | 'billing'
  | 'salesman_behavior'
  | 'other';

export type ComplaintRecipient = 'salesman' | 'manager';

export type ComplaintStatus = 'open' | 'in_review' | 'resolved';

export type Complaint = {
  id: string;
  customerUserId: string;
  category: ComplaintCategory;
  recipient: ComplaintRecipient;
  description: string;
  status: ComplaintStatus;
  rating?: number;             // 1-5 — only set after status === 'resolved'
  filedAt: number;
  resolvedAt?: number;
};
