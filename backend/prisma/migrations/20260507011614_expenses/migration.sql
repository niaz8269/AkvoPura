-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('fuel', 'food', 'repairs', 'utilities', 'salary', 'raw_material', 'other');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'rejected', 'forwarded');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedByName" TEXT NOT NULL,
    "submittedByRole" "Role" NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'pending',
    "decisionNote" TEXT,
    "decidedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_branchSlug_status_idx" ON "expenses"("branchSlug", "status");

-- CreateIndex
CREATE INDEX "expenses_branchSlug_submittedAt_idx" ON "expenses"("branchSlug", "submittedAt");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
