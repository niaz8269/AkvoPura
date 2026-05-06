-- CreateTable
CREATE TABLE "pricing" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "pet600Price" INTEGER NOT NULL DEFAULT 280,
    "pet1500Price" INTEGER NOT NULL DEFAULT 320,
    "canPrice" INTEGER NOT NULL DEFAULT 280,
    "gallonPrice" INTEGER NOT NULL DEFAULT 200,
    "lostCanFee" INTEGER NOT NULL DEFAULT 600,
    "lostGallonFee" INTEGER NOT NULL DEFAULT 900,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_scope_key" ON "pricing"("scope");
