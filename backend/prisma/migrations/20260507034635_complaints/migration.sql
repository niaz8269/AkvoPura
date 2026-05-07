-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('delivery', 'product_quality', 'billing', 'salesman_behavior', 'other');

-- CreateEnum
CREATE TYPE "ComplaintRecipient" AS ENUM ('salesman', 'manager');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'in_review', 'resolved');

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "recipient" "ComplaintRecipient" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "rating" INTEGER,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "complaints_branchSlug_status_idx" ON "complaints"("branchSlug", "status");

-- CreateIndex
CREATE INDEX "complaints_customerUserId_filedAt_idx" ON "complaints"("customerUserId", "filedAt");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
