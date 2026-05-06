/*
  Warnings:

  - You are about to drop the column `branch` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'production_worker';
ALTER TYPE "Role" ADD VALUE 'driver';
ALTER TYPE "Role" ADD VALUE 'helper';
ALTER TYPE "Role" ADD VALUE 'other';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "branch",
ADD COLUMN     "branchSlug" TEXT;

-- DropEnum
DROP TYPE "Branch";

-- CreateTable
CREATE TABLE "branches" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameUr" TEXT,
    "location" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("slug")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
