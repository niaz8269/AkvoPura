-- Trip: separate the manager's assignment (preparedAt) from the salesman's
-- start (openedAt). openedAt becomes nullable — null means "waiting in the
-- salesman's assignment list, not yet started."
--
-- Existing rows: keep their current openedAt value (they were started already
-- under the old flow). Backfill preparedAt = openedAt so old trips still sort
-- correctly in the manager UI.

-- Add new columns.
ALTER TABLE "trips" ADD COLUMN "preparedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "trips" ADD COLUMN "preparedById" TEXT;
ALTER TABLE "trips" ADD COLUMN "cancelledAt"  TIMESTAMP(3);

-- Backfill preparedAt from openedAt so existing trips look sensible in the
-- new "assignment queue" ordering.
UPDATE "trips" SET "preparedAt" = "openedAt" WHERE "openedAt" IS NOT NULL;

-- openedAt becomes nullable now that a trip can exist in "prepared but not
-- started" state.
ALTER TABLE "trips" ALTER COLUMN "openedAt" DROP NOT NULL;
ALTER TABLE "trips" ALTER COLUMN "openedAt" DROP DEFAULT;

-- Drop the old (branchSlug, openedAt) and (salesmanId, openedAt) indexes and
-- replace with preparedAt-based ones for the assignment-queue queries.
DROP INDEX IF EXISTS "trips_branchSlug_openedAt_idx";
DROP INDEX IF EXISTS "trips_salesmanId_openedAt_idx";
CREATE INDEX "trips_branchSlug_preparedAt_idx"   ON "trips"("branchSlug",  "preparedAt");
CREATE INDEX "trips_salesmanId_preparedAt_idx"   ON "trips"("salesmanId", "preparedAt");
CREATE INDEX "trips_openedAt_idx"                ON "trips"("openedAt");

-- Expense → Trip link. Auto-attached at record time when the submitting
-- salesman has an active trip. Nullable (managers submitting expenses,
-- salesmen submitting outside a trip, legacy rows).
ALTER TABLE "expenses" ADD COLUMN "tripId" TEXT;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "expenses_tripId_idx" ON "expenses"("tripId");
