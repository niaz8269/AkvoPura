-- CreateTable
CREATE TABLE "pet_customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "outstandingDebt" INTEGER NOT NULL DEFAULT 0,
    "pricePet600" INTEGER,
    "pricePet1500" INTEGER,
    "lastActivityAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_bills" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "pet600Packs" INTEGER NOT NULL,
    "pet1500Packs" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "amountBilled" INTEGER NOT NULL,
    "cashCollected" INTEGER NOT NULL DEFAULT 0,
    "tripNumber" INTEGER NOT NULL DEFAULT 1,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_returns" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "pet600Packs" INTEGER NOT NULL,
    "pet1500Packs" INTEGER NOT NULL,
    "refundAmount" INTEGER NOT NULL,
    "reason" TEXT,
    "tripNumber" INTEGER NOT NULL DEFAULT 1,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_returns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pet_customers_branchSlug_active_idx" ON "pet_customers"("branchSlug", "active");

-- CreateIndex
CREATE INDEX "pet_bills_branchSlug_loggedAt_idx" ON "pet_bills"("branchSlug", "loggedAt");

-- CreateIndex
CREATE INDEX "pet_bills_salesmanId_loggedAt_idx" ON "pet_bills"("salesmanId", "loggedAt");

-- CreateIndex
CREATE INDEX "pet_bills_customerId_loggedAt_idx" ON "pet_bills"("customerId", "loggedAt");

-- CreateIndex
CREATE INDEX "pet_returns_branchSlug_loggedAt_idx" ON "pet_returns"("branchSlug", "loggedAt");

-- CreateIndex
CREATE INDEX "pet_returns_salesmanId_loggedAt_idx" ON "pet_returns"("salesmanId", "loggedAt");

-- CreateIndex
CREATE INDEX "pet_returns_customerId_loggedAt_idx" ON "pet_returns"("customerId", "loggedAt");

-- AddForeignKey
ALTER TABLE "pet_customers" ADD CONSTRAINT "pet_customers_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_bills" ADD CONSTRAINT "pet_bills_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "pet_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_returns" ADD CONSTRAINT "pet_returns_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "pet_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
