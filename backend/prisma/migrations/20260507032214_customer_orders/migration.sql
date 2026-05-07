-- CreateEnum
CREATE TYPE "CustomerOrderStatus" AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "preferredTime" TEXT,
    "notes" TEXT,
    "status" "CustomerOrderStatus" NOT NULL DEFAULT 'pending',
    "assignedSalesmanId" TEXT,
    "assignedSalesmanName" TEXT,
    "managerNote" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_orders_branchSlug_status_idx" ON "customer_orders"("branchSlug", "status");

-- CreateIndex
CREATE INDEX "customer_orders_customerUserId_placedAt_idx" ON "customer_orders"("customerUserId", "placedAt");

-- CreateIndex
CREATE INDEX "customer_orders_assignedSalesmanId_status_idx" ON "customer_orders"("assignedSalesmanId", "status");

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
