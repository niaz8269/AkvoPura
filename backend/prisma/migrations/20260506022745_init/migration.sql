-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'manager', 'pets_salesman', 'cans_gallons_salesman', 'customer');

-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('timergara', 'shergarh');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branch" "Branch",
    "linkedCgCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_identifier_key" ON "users"("identifier");
