/**
 * Demo expense submissions awaiting Manager approval.
 *
 * These represent expenses logged by salesmen during today's trip that the
 * manager needs to act on. Replaced by real data when backend lands.
 *
 * Threshold above which an expense would normally be forwarded to the Owner —
 * stored here so the UI can flag big-ticket items.
 */

import type { Expense } from './types';

export const HIGH_VALUE_THRESHOLD = 5000;

const now = Date.now();
const minutesAgo = (n: number) => now - n * 60_000;

export const demoExpenses: Expense[] = [
  {
    id: 'e-1',
    submittedBy: 'Pets Salesman',
    submittedByRole: 'pets_salesman',
    category: 'fuel',
    amount: 1800,
    notes: 'Diesel — bypass pump',
    status: 'pending',
    submittedAt: minutesAgo(45),
  },
  {
    id: 'e-2',
    submittedBy: 'Cans/Gallons Salesman',
    submittedByRole: 'cans_gallons_salesman',
    category: 'food',
    amount: 350,
    notes: 'Lunch with helper',
    status: 'pending',
    submittedAt: minutesAgo(120),
  },
  {
    id: 'e-3',
    submittedBy: 'Cans/Gallons Salesman',
    submittedByRole: 'cans_gallons_salesman',
    category: 'repairs',
    amount: 6500,
    notes: 'Tyre puncture + new tube — needs owner approval',
    status: 'pending',
    submittedAt: minutesAgo(20),
  },
  {
    id: 'e-4',
    submittedBy: 'Pets Salesman',
    submittedByRole: 'pets_salesman',
    category: 'other',
    amount: 200,
    notes: 'Mobile recharge',
    status: 'pending',
    submittedAt: minutesAgo(10),
  },
];

export const expenseCategoryLabels: Record<Expense['category'], { en: string; ur: string }> = {
  fuel: { en: 'Fuel', ur: 'ایندھن' },
  food: { en: 'Food', ur: 'کھانا' },
  repairs: { en: 'Repairs', ur: 'مرمت' },
  utilities: { en: 'Utilities', ur: 'یوٹیلٹیز' },
  salary: { en: 'Salary', ur: 'تنخواہ' },
  raw_material: { en: 'Raw Material', ur: 'خام مال' },
  other: { en: 'Other', ur: 'دیگر' },
};
