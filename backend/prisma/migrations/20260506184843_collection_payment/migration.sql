-- AlterTable
ALTER TABLE "cg_collections" ADD COLUMN     "bankCollected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cashCollected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentReference" TEXT;
