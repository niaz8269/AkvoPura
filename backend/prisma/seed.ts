/**
 * Seed the database with the same accounts the mobile app's old mock used,
 * plus the two starting branches (Timergara, Shergarh). Both are upserts
 * so re-running is safe.
 */

import { PrismaClient, Role } from '@prisma/client';
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
