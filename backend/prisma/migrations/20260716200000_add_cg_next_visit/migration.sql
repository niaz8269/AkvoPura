-- Next-visit intent captured during a CG collection visit.
-- Salesman records what the customer said about tomorrow ("skip" / "2 cans" / etc.)
-- so the next day's route sheet can show it.
--
-- All fields nullable; expiry is calculated from nextVisitDate (client-side).
-- Cleared when a delivery is recorded for the customer.
ALTER TABLE "cg_customers" ADD COLUMN "nextVisitDate" TEXT;
ALTER TABLE "cg_customers" ADD COLUMN "nextVisitSkip" BOOLEAN;
ALTER TABLE "cg_customers" ADD COLUMN "nextVisitCans" INTEGER;
ALTER TABLE "cg_customers" ADD COLUMN "nextVisitGallons" INTEGER;
ALTER TABLE "cg_customers" ADD COLUMN "nextVisitNote" TEXT;
