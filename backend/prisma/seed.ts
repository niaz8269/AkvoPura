/**
 * Seed the database with the same accounts the mobile app's old mock used,
 * plus the two starting branches (Timergara, Shergarh). Both are upserts
 * so re-running is safe.
 */

import { PrismaClient, Role, CGRoute, PaymentCycle } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const branches = [
  { slug: 'timergara', name: 'Timergara', nameUr: 'تیمرگرہ' },
  { slug: 'shergarh',  name: 'Shergarh',  nameUr: 'شیر گڑھ' },
];

type Seed = {
  identifier: string;
  name: string;
  password: string;
  role: Role;
  branchSlug?: string;
  linkedCgCustomerId?: string;
};

/** Mirror of mobile/src/cg/demoData.ts so the new backend ships with
 *  the same demo customers the salesman has been seeing in the app. */
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60_000);

type DemoCG = {
  id: string;
  name: string;
  phone: string;
  address: string;
  branchSlug: string;
  route: CGRoute;
  paymentCycle: PaymentCycle;
  usualCans: number;
  usualGallons: number;
  emptyCansHeld: number;
  emptyGallonsHeld: number;
  outstandingDebt: number;
  pricePerCan: number;
  pricePerGallon: number;
  lastActivityAt?: Date;
  notes?: string;
};

const cgCustomers: DemoCG[] = [
  // --- Hospital route ---
  { id: 'c-h1', name: 'DHQ Hospital — ICU Block', phone: '0300-1112233', address: 'DHQ Hospital, ICU Block, Timergara', branchSlug: 'timergara', route: CGRoute.hospital, paymentCycle: PaymentCycle.daily,  usualCans: 4, usualGallons: 6, emptyCansHeld: 4, emptyGallonsHeld: 6, outstandingDebt: 0,    pricePerCan: 250, pricePerGallon: 180, lastActivityAt: daysAgo(1),  notes: 'Deliver before 9 AM. Ask for Sister Aisha.' },
  { id: 'c-h2', name: 'DHQ Hospital — OPD',       phone: '0300-1112244', address: 'DHQ Hospital, OPD wing',           branchSlug: 'timergara', route: CGRoute.hospital, paymentCycle: PaymentCycle.daily,  usualCans: 3, usualGallons: 2, emptyCansHeld: 0, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 250, pricePerGallon: 180, lastActivityAt: daysAgo(2) },
  { id: 'c-h3', name: 'Khan Medical Centre',      phone: '0301-7788990', address: 'Hospital Road, near pharmacy',     branchSlug: 'timergara', route: CGRoute.hospital, paymentCycle: PaymentCycle.weekly, usualCans: 2, usualGallons: 3, emptyCansHeld: 2, emptyGallonsHeld: 0, outstandingDebt: 4500, pricePerCan: 270, pricePerGallon: 200, lastActivityAt: daysAgo(45), notes: 'Owes from previous month — chase payment.' },
  { id: 'c-h4', name: 'Saima Maternity Home',     phone: '0312-4455667', address: 'Hospital Road, Block C',           branchSlug: 'timergara', route: CGRoute.hospital, paymentCycle: PaymentCycle.weekly, usualCans: 1, usualGallons: 2, emptyCansHeld: 1, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 270, pricePerGallon: 200, lastActivityAt: daysAgo(8) },

  // --- Bypass route ---
  { id: 'c-b1', name: 'Al-Madina Restaurant',     phone: '0344-5566778', address: 'Bypass Road, near fuel pump',      branchSlug: 'timergara', route: CGRoute.bypass,   paymentCycle: PaymentCycle.daily,  usualCans: 5, usualGallons: 4, emptyCansHeld: 0, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 260, pricePerGallon: 190, lastActivityAt: daysAgo(1) },
  { id: 'c-b2', name: 'Bypass Tyre Shop — Office',phone: '0345-9988776', address: 'Bypass Road, Tyre market',         branchSlug: 'timergara', route: CGRoute.bypass,   paymentCycle: PaymentCycle.weekly, usualCans: 1, usualGallons: 1, emptyCansHeld: 1, emptyGallonsHeld: 1, outstandingDebt: 1200, pricePerCan: 260, pricePerGallon: 190, lastActivityAt: daysAgo(60) },
  { id: 'c-b3', name: 'Falcon Petrol Pump',       phone: '0322-1010101', address: 'Bypass main road, opposite mosque',branchSlug: 'timergara', route: CGRoute.bypass,   paymentCycle: PaymentCycle.daily,  usualCans: 2, usualGallons: 1, emptyCansHeld: 0, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 260, pricePerGallon: 190, lastActivityAt: daysAgo(3) },
  { id: 'c-b4', name: 'Hajji Karim Tea Stall',    phone: '0331-2233445', address: 'Bypass turn, before bridge',       branchSlug: 'timergara', route: CGRoute.bypass,   paymentCycle: PaymentCycle.daily,  usualCans: 1, usualGallons: 0, emptyCansHeld: 2, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 260, pricePerGallon: 190, lastActivityAt: daysAgo(5),  notes: 'Old man — be patient, sometimes pays slow.' },

  // --- Others route ---
  { id: 'c-o1', name: 'Government Boys School',   phone: '0300-7654321', address: 'Main Bazaar, school street',       branchSlug: 'timergara', route: CGRoute.others,   paymentCycle: PaymentCycle.weekly, usualCans: 2, usualGallons: 4, emptyCansHeld: 0, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 240, pricePerGallon: 170, lastActivityAt: daysAgo(12), notes: 'Office hours only (8 AM – 2 PM).' },
  { id: 'c-o2', name: 'Hira Beauty Parlour',      phone: '0335-8899001', address: 'Bazaar second floor',              branchSlug: 'timergara', route: CGRoute.others,   paymentCycle: PaymentCycle.weekly, usualCans: 1, usualGallons: 0, emptyCansHeld: 1, emptyGallonsHeld: 0, outstandingDebt: 800,  pricePerCan: 280, pricePerGallon: 210, lastActivityAt: daysAgo(70) },
  { id: 'c-o3', name: 'Rashid Auto Workshop',     phone: '0310-7777888', address: 'Workshop street, near garage',     branchSlug: 'timergara', route: CGRoute.others,   paymentCycle: PaymentCycle.weekly, usualCans: 1, usualGallons: 1, emptyCansHeld: 0, emptyGallonsHeld: 0, outstandingDebt: 0,    pricePerCan: 270, pricePerGallon: 200, lastActivityAt: daysAgo(25) },
  { id: 'c-o4', name: 'Family — Akbar Khan',      phone: '0303-2424242', address: 'House #14, Street 5',              branchSlug: 'timergara', route: CGRoute.others,   paymentCycle: PaymentCycle.weekly, usualCans: 0, usualGallons: 1, emptyCansHeld: 0, emptyGallonsHeld: 1, outstandingDebt: 0,    pricePerCan: 280, pricePerGallon: 220, lastActivityAt: daysAgo(10), notes: 'Domestic customer.' },

  // Linked to the seeded Customer-role test user.
  { id: 'c-test', name: 'Test Customer',          phone: '0300-0000001', address: 'House #7, Street 12',              branchSlug: 'timergara', route: CGRoute.others,   paymentCycle: PaymentCycle.weekly, usualCans: 1, usualGallons: 2, emptyCansHeld: 1, emptyGallonsHeld: 2, outstandingDebt: 1500, pricePerCan: 280, pricePerGallon: 200, lastActivityAt: daysAgo(4) },
];

const accounts: Seed[] = [
  { identifier: 'owner',     name: 'Owner',                password: 'owner',    role: Role.owner },
  { identifier: 'manager_t', name: 'Timergara Manager',    password: 'manager',  role: Role.manager,                 branchSlug: 'timergara' },
  { identifier: 'manager_s', name: 'Shergarh Manager',     password: 'manager',  role: Role.manager,                 branchSlug: 'shergarh' },
  { identifier: 'pets',      name: 'Imran (Pets)',         password: 'pets',     role: Role.pets_salesman,           branchSlug: 'timergara' },
  { identifier: 'pets2',     name: 'Bilal (Pets)',         password: 'pets',     role: Role.pets_salesman,           branchSlug: 'timergara' },
  { identifier: 'cans',      name: 'Asif (Cans/Gallons)',  password: 'cans',     role: Role.cans_gallons_salesman,   branchSlug: 'timergara' },
  { identifier: 'cans2',     name: 'Zubair (Cans/Gallons)', password: 'cans',    role: Role.cans_gallons_salesman,   branchSlug: 'timergara' },
  { identifier: 'customer',  name: 'Test Customer',        password: 'customer', role: Role.customer,                branchSlug: 'timergara', linkedCgCustomerId: 'c-test' },
];

async function main() {
  console.log('Pricing:');
  await prisma.pricing.upsert({
    where: { scope: 'global' },
    update: {},
    create: { scope: 'global' },
  });
  console.log('  ✔ global (defaults)');

  console.log('Branches:');
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameUr: b.nameUr },
      create: b,
    });
    console.log(`  ✔ ${b.slug.padEnd(10)} ${b.name}`);
  }

  console.log('CG customers:');
  for (const c of cgCustomers) {
    await prisma.cGCustomer.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        phone: c.phone,
        address: c.address,
        branchSlug: c.branchSlug,
        route: c.route,
        paymentCycle: c.paymentCycle,
        usualCans: c.usualCans,
        usualGallons: c.usualGallons,
        emptyCansHeld: c.emptyCansHeld,
        emptyGallonsHeld: c.emptyGallonsHeld,
        outstandingDebt: c.outstandingDebt,
        pricePerCan: c.pricePerCan,
        pricePerGallon: c.pricePerGallon,
        lastActivityAt: c.lastActivityAt ?? null,
        notes: c.notes ?? null,
      },
      create: c,
    });
    console.log(`  ✔ ${c.id.padEnd(8)} ${c.name}`);
  }

  console.log('Users:');
  for (const a of accounts) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    await prisma.user.upsert({
      where: { identifier: a.identifier },
      update: {
        name: a.name,
        passwordHash,
        role: a.role,
        branchSlug: a.branchSlug ?? null,
        linkedCgCustomerId: a.linkedCgCustomerId ?? null,
      },
      create: {
        identifier: a.identifier,
        name: a.name,
        passwordHash,
        role: a.role,
        branchSlug: a.branchSlug ?? null,
        linkedCgCustomerId: a.linkedCgCustomerId ?? null,
      },
    });
    console.log(`  ✔ ${a.identifier.padEnd(10)} (${a.role}${a.branchSlug ? ' / ' + a.branchSlug : ''})`);
  }
}

main()
  .then(() => console.log('Seed complete.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
