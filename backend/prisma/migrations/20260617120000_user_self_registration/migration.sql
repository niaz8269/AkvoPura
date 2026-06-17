-- Add columns to support customer self-registration + manager verification.
ALTER TABLE "users"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pendingCustomerKind" TEXT;

-- Index for the "pending registrations" query a manager runs frequently.
CREATE INDEX "users_branchSlug_verified_idx" ON "users"("branchSlug", "verified");
