-- CreateEnum
CREATE TYPE "ProducedProduct" AS ENUM ('pet600', 'pet1500', 'can', 'gallon');

-- CreateEnum
CREATE TYPE "RawMaterialUnit" AS ENUM ('pieces', 'rolls');

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameUr" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
    "unit" "RawMaterialUnit" NOT NULL DEFAULT 'pieces',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL,
    "branchSlug" TEXT NOT NULL,
    "product" "ProducedProduct" NOT NULL,
    "unitsProduced" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "tdsPpm" INTEGER,
    "phLevel" DOUBLE PRECISION,
    "wastage" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "loggedById" TEXT NOT NULL,
    "loggedByName" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_batches_branchSlug_loggedAt_idx" ON "production_batches"("branchSlug", "loggedAt");

-- CreateIndex
CREATE INDEX "production_batches_branchSlug_product_loggedAt_idx" ON "production_batches"("branchSlug", "product", "loggedAt");

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_branchSlug_fkey" FOREIGN KEY ("branchSlug") REFERENCES "branches"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
