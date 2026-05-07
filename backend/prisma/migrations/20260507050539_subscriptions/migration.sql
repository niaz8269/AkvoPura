-- CreateEnum
CREATE TYPE "SubscriptionCadence" AS ENUM ('weekly');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "cadence" "SubscriptionCadence" NOT NULL DEFAULT 'weekly',
    "daysOfWeek" INTEGER[],
    "preferredTime" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedOn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_branchSlug_active_idx" ON "subscriptions"("branchSlug", "active");

-- CreateIndex
CREATE INDEX "subscriptions_customerUserId_idx" ON "subscriptions"("customerUserId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
