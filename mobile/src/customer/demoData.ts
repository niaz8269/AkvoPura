/**
 * Seed orders + complaints for the test customer (u-customer).
 * Replaces with real backend data later.
 */

import type { Complaint, CustomerOrder } from './types';

const now = Date.now();
const minutesAgo = (n: number) => now - n * 60_000;
const daysAgo = (n: number) => now - n * 24 * 60 * 60_000;

export const demoOrders: CustomerOrder[] = [
  {
    id: 'o-1',
    customerUserId: 'u-customer',
    items: [
      { productId: 'gallons', qty: 2, unitPrice: 200 },
      { productId: 'cans', qty: 1, unitPrice: 280 },
    ],
    totalAmount: 680,
    preferredTime: 'Before 6 PM',
    status: 'in_transit',
    placedAt: minutesAgo(40),
    updatedAt: minutesAgo(15),
  },
  {
    id: 'o-2',
    customerUserId: 'u-customer',
    items: [{ productId: 'gallons', qty: 1, unitPrice: 200 }],
    totalAmount: 200,
    status: 'delivered',
    placedAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

export const demoComplaints: Complaint[] = [
  {
    id: 'cp-1',
    customerUserId: 'u-customer',
    category: 'delivery',
    recipient: 'manager',
    description: 'Salesman did not arrive yesterday despite confirmation.',
    status: 'in_review',
    filedAt: daysAgo(1),
  },
];

export const productCatalog: {
  id: 'cans' | 'gallons' | 'pet600' | 'pet1500';
  nameEn: string;
  nameUr: string;
  defaultPrice: number;
  description: string;
}[] = [
  {
    id: 'cans',
    nameEn: '14 L can',
    nameUr: '۱۴ لیٹر کین',
    defaultPrice: 280,
    description: 'Reusable 14-litre can. Empty must be returned.',
  },
  {
    id: 'gallons',
    nameEn: '19 L gallon',
    nameUr: '۱۹ لیٹر گیلن',
    defaultPrice: 200,
    description: 'Reusable 19-litre gallon. Empty must be returned.',
  },
  {
    id: 'pet600',
    nameEn: '600 ml pack',
    nameUr: '۶۰۰ ملی پیک',
    defaultPrice: 280,
    description: 'Disposable pack of 12 × 600ml bottles.',
  },
  {
    id: 'pet1500',
    nameEn: '1.5 L pack',
    nameUr: '۱.۵ لیٹر پیک',
    defaultPrice: 320,
    description: 'Disposable pack of 6 × 1.5L bottles.',
  },
];
