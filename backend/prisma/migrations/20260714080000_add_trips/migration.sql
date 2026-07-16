-- CreateEnum
CREATE TYPE "TripRole" AS ENUM ('cg', 'pets');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "role" "TripRole" NOT NULL,
    "vehicleLabel" TEXT NOT NULL,
    "initialCansLoaded" INTEGER NOT NULL DEFAULT 0,
    "initialGallonsLoaded" INTEGER NOT NULL DEFAULT 0,
    "initialPet600Packs" INTEGER NOT NULL DEFAULT 0,
    "initialPet1500Packs" INTEGER NOT NULL DEFAULT 0,
    "finalCansOnVan" INTEGER,
    "finalGallonsOnVan" INTEGER,
    "finalEmptyCansOnVan" INTEGER,
    "finalEmptyGallonsOnVan" INTEGER,
    "finalPet600Packs" INTEGER,
    "finalPet1500Packs" INTEGER,
    "declaredCashOnHand" INTEGER,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_branchSlug_openedAt_idx" ON "trips"("branchSlug", "openedAt");
CREATE INDEX "trips_salesmanId_openedAt_idx" ON "trips"("salesmanId", "openedAt");
CREATE INDEX "trips_closedAt_idx" ON "trips"("closedAt");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_salesmanId_fkey"
  FOREIGN KEY ("salesmanId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trips" ADD CONSTRAINT "trips_branchSlug_fkey"
  FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add nullable tripId FK to each activity table.
-- Legacy pre-trip-model rows remain with tripId = NULL and are surfaced
-- in the manager UI under a "Pre-trip activity" bucket.
ALTER TABLE "cg_deliveries" ADD COLUMN "tripId" TEXT;
ALTER TABLE "cg_deliveries" ADD CONSTRAINT "cg_deliveries_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "cg_deliveries_tripId_idx" ON "cg_deliveries"("tripId");

ALTER TABLE "cg_collections" ADD COLUMN "tripId" TEXT;
ALTER TABLE "cg_collections" ADD CONSTRAINT "cg_collections_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "cg_collections_tripId_idx" ON "cg_collections"("tripId");

ALTER TABLE "pet_bills" ADD COLUMN "tripId" TEXT;
ALTER TABLE "pet_bills" ADD CONSTRAINT "pet_bills_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "pet_bills_tripId_idx" ON "pet_bills"("tripId");

ALTER TABLE "pet_returns" ADD COLUMN "tripId" TEXT;
ALTER TABLE "pet_returns" ADD CONSTRAINT "pet_returns_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "pet_returns_tripId_idx" ON "pet_returns"("tripId");
