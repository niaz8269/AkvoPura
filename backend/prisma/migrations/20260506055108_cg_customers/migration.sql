-- CreateEnum
CREATE TYPE "CGRoute" AS ENUM ('hospital', 'bypass', 'others');

-- CreateEnum
CREATE TYPE "PaymentCycle" AS ENUM ('daily', 'weekly');

-- CreateTable
CREATE TABLE "cg_customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "route" "CGRoute" NOT NULL,
    "paymentCycle" "PaymentCycle" NOT NULL,
    "usualCans" INTEGER NOT NULL DEFAULT 0,
    "usualGallons" INTEGER NOT NULL DEFAULT 0,
    "emptyCansHeld" INTEGER NOT NULL DEFAULT 0,
    "emptyGallonsHeld" INTEGER NOT NULL DEFAULT 0,
    "outstandingDebt" INTEGER NOT NULL DEFAULT 0,
    "pricePerCan" INTEGER NOT NULL,
    "pricePerGallon" INTEGER NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cg_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cg_customers_branchSlug_active_idx" ON "cg_customers"("branchSlug", "active");

-- CreateIndex
CREATE INDEX "cg_customers_branchSlug_route_idx" ON "cg_customers"("branchSlug", "route");

-- AddForeignKey
ALTER TABLE "cg_customers" ADD CONSTRAINT "cg_customers_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
