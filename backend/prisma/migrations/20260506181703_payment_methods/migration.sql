-- AlterTable
ALTER TABLE "cg_deliveries" ADD COLUMN     "bankCollected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "pet_bills" ADD COLUMN     "bankCollected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentReference" TEXT;
