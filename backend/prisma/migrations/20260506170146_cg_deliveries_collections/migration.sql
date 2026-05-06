-- CreateTable
CREATE TABLE "cg_deliveries" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "cansDelivered" INTEGER NOT NULL,
    "gallonsDelivered" INTEGER NOT NULL,
    "emptyCansCollected" INTEGER NOT NULL,
    "emptyGallonsCollected" INTEGER NOT NULL,
    "cashCollected" INTEGER NOT NULL,
    "amountBilled" INTEGER NOT NULL,
    "tripNumber" INTEGER NOT NULL DEFAULT 1,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cg_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cg_collections" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "cansCollected" INTEGER NOT NULL,
    "gallonsCollected" INTEGER NOT NULL,
    "tripNumber" INTEGER NOT NULL DEFAULT 1,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cg_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cg_deliveries_branchSlug_loggedAt_idx" ON "cg_deliveries"("branchSlug", "loggedAt");

-- CreateIndex
CREATE INDEX "cg_deliveries_salesmanId_loggedAt_idx" ON "cg_deliveries"("salesmanId", "loggedAt");

-- CreateIndex
CREATE INDEX "cg_deliveries_customerId_loggedAt_idx" ON "cg_deliveries"("customerId", "loggedAt");

-- CreateIndex
CREATE INDEX "cg_collections_branchSlug_loggedAt_idx" ON "cg_collections"("branchSlug", "loggedAt");

-- CreateIndex
CREATE INDEX "cg_collections_salesmanId_loggedAt_idx" ON "cg_collections"("salesmanId", "loggedAt");

-- CreateIndex
CREATE INDEX "cg_collections_customerId_loggedAt_idx" ON "cg_collections"("customerId", "loggedAt");

-- AddForeignKey
ALTER TABLE "cg_deliveries" ADD CONSTRAINT "cg_deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "cg_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cg_collections" ADD CONSTRAINT "cg_collections_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "cg_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
