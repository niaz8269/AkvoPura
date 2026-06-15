/**
 * One-off helper: rotate the seed-default passwords to production passwords.
 *
 * Usage:
 *   npx ts-node prisma/rotate-passwords.ts <identifier> <new-password>
 *
 * Examples (run from backend/):
 *   npx ts-node prisma/rotate-passwords.ts owner     'Akv0Pur@-Owner-2026!'
 *   npx ts-node prisma/rotate-passwords.ts manager_t 'Timrgr@-Mgr-2026!'
 *   npx ts-node prisma/rotate-passwords.ts manager_s 'Shrgrh@-Mgr-2026!'
 *
 * To target the PRODUCTION database, set DATABASE_URL first:
 *   $env:DATABASE_URL='postgresql://...render external url...'
 *   npx ts-node prisma/rotate-passwords.ts owner 'newPassword'
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [, , identifier, newPassword] = process.argv;
  if (!identifier || !newPassword) {
    console.error('Usage: ts-node rotate-passwords.ts <identifier> <new-password>');
    process.exit(1);
  }
  if (newPassword.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { identifier } });
  if (!user) {
    console.error(`No user with identifier "${identifier}"`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { identifier },
    data: { passwordHash },
  });
  console.log(`✔ Password rotated for "${identifier}" (${user.role}${user.branchSlug ? ' / ' + user.branchSlug : ''})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
