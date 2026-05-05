/**
 * Seed employees + a few open attendance entries so the Manager screen has
 * something to demo on first load.
 */

import type { AttendanceEntry, Employee } from './types';

const today = new Date();
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const TODAY = isoDate(today);
const hoursAgo = (h: number) => Date.now() - h * 60 * 60_000;
const daysAgo = (n: number) => Date.now() - n * 24 * 60 * 60_000;

export const demoEmployees: Employee[] = [
  // --- Managers ---
  {
    id: 'emp-mgr-tim',
    linkedUserId: 'u-mgr-tim',
    name: 'Timergara Manager',
    phone: '0301-1000001',
    role: 'manager',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 75_000,
    active: true,
    hiredAt: daysAgo(800),
  },
  {
    id: 'emp-mgr-sher',
    linkedUserId: 'u-mgr-sher',
    name: 'Shergarh Manager',
    phone: '0301-1000002',
    role: 'manager',
    branch: 'shergarh',
    employmentType: 'salaried',
    monthlySalary: 75_000,
    active: true,
    hiredAt: daysAgo(620),
  },

  // --- Salesmen (linked to mockUsers) ---
  {
    id: 'emp-pets-1',
    linkedUserId: 'u-pets-sales',
    name: 'Imran (Pets)',
    phone: '0300-2000001',
    role: 'pets_salesman',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 45_000,
    active: true,
    hiredAt: daysAgo(420),
  },
  {
    id: 'emp-pets-2',
    linkedUserId: 'u-pets-sales-2',
    name: 'Bilal (Pets)',
    phone: '0300-2000002',
    role: 'pets_salesman',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 42_000,
    active: true,
    hiredAt: daysAgo(180),
  },
  {
    id: 'emp-cg-1',
    linkedUserId: 'u-cg-sales',
    name: 'Asif (Cans/Gallons)',
    phone: '0300-2000003',
    role: 'cans_gallons_salesman',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 48_000,
    active: true,
    hiredAt: daysAgo(540),
  },
  {
    id: 'emp-cg-2',
    linkedUserId: 'u-cg-sales-2',
    name: 'Zubair (Cans/Gallons)',
    phone: '0300-2000004',
    role: 'cans_gallons_salesman',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 42_000,
    active: true,
    hiredAt: daysAgo(95),
  },

  // --- Production workers (hourly) ---
  {
    id: 'emp-prod-1',
    name: 'Naseer (Production)',
    phone: '0312-3000001',
    role: 'production_worker',
    branch: 'timergara',
    employmentType: 'hourly',
    hourlyRate: 220,
    active: true,
    hiredAt: daysAgo(300),
  },
  {
    id: 'emp-prod-2',
    name: 'Wajid (Production)',
    phone: '0312-3000002',
    role: 'production_worker',
    branch: 'timergara',
    employmentType: 'hourly',
    hourlyRate: 200,
    active: true,
    hiredAt: daysAgo(140),
    notes: 'New joiner — still in training',
  },

  // --- Drivers + helpers ---
  {
    id: 'emp-drv-1',
    name: 'Khalid (Driver)',
    phone: '0322-4000001',
    role: 'driver',
    branch: 'timergara',
    employmentType: 'salaried',
    monthlySalary: 38_000,
    active: true,
    hiredAt: daysAgo(700),
  },
  {
    id: 'emp-help-1',
    name: 'Yousaf (Helper)',
    phone: '0345-5000001',
    role: 'helper',
    branch: 'timergara',
    employmentType: 'hourly',
    hourlyRate: 180,
    active: true,
    hiredAt: daysAgo(60),
  },
];

/** Open attendance entries — some checked in, some checked out, some absent. */
export const demoAttendance: AttendanceEntry[] = [
  // Mgr Timergara — checked in 4h ago, still in
  {
    id: 'att-1',
    employeeId: 'emp-mgr-tim',
    date: TODAY,
    checkInAt: hoursAgo(4),
    checkOutAt: null,
  },
  // Imran (Pets) — checked in 3h ago, still in
  {
    id: 'att-2',
    employeeId: 'emp-pets-1',
    date: TODAY,
    checkInAt: hoursAgo(3),
    checkOutAt: null,
  },
  // Asif (CG) — checked in 5h ago, still in
  {
    id: 'att-3',
    employeeId: 'emp-cg-1',
    date: TODAY,
    checkInAt: hoursAgo(5),
    checkOutAt: null,
  },
  // Naseer (production hourly) — checked in 6h ago + checked out 1h ago
  {
    id: 'att-4',
    employeeId: 'emp-prod-1',
    date: TODAY,
    checkInAt: hoursAgo(6),
    checkOutAt: hoursAgo(1),
  },
  // Wajid (production hourly) — half day, checked in 2h ago, still in
  {
    id: 'att-5',
    employeeId: 'emp-prod-2',
    date: TODAY,
    checkInAt: hoursAgo(2),
    checkOutAt: null,
    note: 'Half day — doctor appointment in afternoon',
  },
  // Khalid (driver) — checked in 5h ago, still in
  {
    id: 'att-6',
    employeeId: 'emp-drv-1',
    date: TODAY,
    checkInAt: hoursAgo(5),
    checkOutAt: null,
  },
  // Yousaf (helper hourly) — checked in 6h ago, still in
  {
    id: 'att-7',
    employeeId: 'emp-help-1',
    date: TODAY,
    checkInAt: hoursAgo(6),
    checkOutAt: null,
  },
  // Note: Bilal (Pets), Zubair (CG), Mgr Shergarh have NOT checked in today.
];

export const ROLE_LABELS: Record<Employee['role'], { en: string; ur: string }> = {
  manager: { en: 'Manager', ur: 'منیجر' },
  pets_salesman: { en: 'Pets Salesman', ur: 'پیٹس سیلز مین' },
  cans_gallons_salesman: { en: 'Cans/Gallons Salesman', ur: 'کین/گیلن سیلز مین' },
  production_worker: { en: 'Production Worker', ur: 'پروڈکشن ورکر' },
  driver: { en: 'Driver', ur: 'ڈرائیور' },
  helper: { en: 'Helper', ur: 'ہیلپر' },
  other: { en: 'Other', ur: 'دیگر' },
};
