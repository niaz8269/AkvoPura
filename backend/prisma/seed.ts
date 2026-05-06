/**
 * Seed the database with the same 9 mock accounts the mobile app uses,
 * so existing logins (owner/owner, manager_t/manager, etc.) keep working
 * once the app is wired to the real /auth/login endpoint.
 */

import { PrismaClient, Role, Branch } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type Seed = {
  identifier: string;
  name: string;
  password: string;
  role: Role;
  branch?: Branch;
  linkedCgCustomerId?: string;
};

const accounts: Seed[] = [
  { identifier: 'owner',     name: 'Owner',                password: 'owner',    role: Role.owner },
  { identifier: 'manager_t', name: 'Timergara Manager',    password: 'manager',  role: Role.manager,                 branch: Branch.timergara },
  { identifier: 'manager_s', name: 'Shergarh Manager',     password: 'manager',  role: Role.manager,                 branch: Branch.shergarh },
  { identifier: 'pets',      name: 'Imran (Pets)',         password: 'pets',     role: Role.pets_salesman,           branch: Branch.timergara },
  { identifier: 'pets2',     name: 'Bilal (Pets)',         password: 'pets',     role: Role.pets_salesman,           branch: Branch.timergara },
  { identifier: 'cans',      name: 'Asif (Cans/Gallons)',  password: 'cans',     role: Role.cans_gallons_salesman,   branch: Branch.timergara },
  { identifier: 'cans2',     name: 'Zubair (Cans/Gallons)', password: 'cans',    role: Role.cans_gallons_salesman,   branch: Branch.timergara },
  { identifier: 'customer',  name: 'Test Customer',        password: 'customer', role: Role.customer,                branch: Branch.timergara, linkedCgCustomerId: 'c-test' },
];

async function main() {
  for (const a of accounts) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    await prisma.user.upsert({
      where: { identifier: a.identifier },
      update: {
        name: a.name,
        passwordHash,
        role: a.role,
        branch: a.branch ?? null,
        linkedCgCustomerId: a.linkedCgCustomerId ?? null,
      },
      create: {
        identifier: a.identifier,
        name: a.name,
        passwordHash,
        role: a.role,
        branch: a.branch ?? null,
        linkedCgCustomerId: a.linkedCgCustomerId ?? null,
      },
    });
    console.log(`  ✔ ${a.identifier.padEnd(10)} (${a.role}${a.branch ? ' / ' + a.branch : ''})`);
  }
}

main()
  .then(() => console.log('Seed complete.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
