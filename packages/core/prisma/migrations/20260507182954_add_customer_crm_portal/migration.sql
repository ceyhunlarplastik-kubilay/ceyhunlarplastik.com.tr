-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CustomerVisitStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "assignedSalesUserId" TEXT,
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedByUserId" TEXT,
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "assignedPurchasingUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "CustomerFeaturedProduct" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFeaturedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerVisit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "CustomerVisitStatus" NOT NULL DEFAULT 'PLANNED',
    "title" TEXT NOT NULL,
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerFeaturedProduct_customerId_displayOrder_idx" ON "CustomerFeaturedProduct"("customerId", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomerFeaturedProduct_productId_idx" ON "CustomerFeaturedProduct"("productId");

-- CreateIndex
CREATE INDEX "CustomerFeaturedProduct_createdByUserId_idx" ON "CustomerFeaturedProduct"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFeaturedProduct_customerId_productId_key" ON "CustomerFeaturedProduct"("customerId", "productId");

-- CreateIndex
CREATE INDEX "CustomerVisit_customerId_scheduledAt_idx" ON "CustomerVisit"("customerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "CustomerVisit_customerId_status_scheduledAt_idx" ON "CustomerVisit"("customerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "CustomerVisit_ownerUserId_status_scheduledAt_idx" ON "CustomerVisit"("ownerUserId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "CustomerVisit_createdByUserId_idx" ON "CustomerVisit"("createdByUserId");

-- CreateIndex
CREATE INDEX "Customer_status_createdAt_idx" ON "Customer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Customer_assignedSalesUserId_status_createdAt_idx" ON "Customer"("assignedSalesUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Supplier_assignedPurchasingUserId_createdAt_idx" ON "Supplier"("assignedPurchasingUserId", "createdAt");

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "User"("customerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_assignedSalesUserId_fkey" FOREIGN KEY ("assignedSalesUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_convertedByUserId_fkey" FOREIGN KEY ("convertedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_assignedPurchasingUserId_fkey" FOREIGN KEY ("assignedPurchasingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeaturedProduct" ADD CONSTRAINT "CustomerFeaturedProduct_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeaturedProduct" ADD CONSTRAINT "CustomerFeaturedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeaturedProduct" ADD CONSTRAINT "CustomerFeaturedProduct_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVisit" ADD CONSTRAINT "CustomerVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVisit" ADD CONSTRAINT "CustomerVisit_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVisit" ADD CONSTRAINT "CustomerVisit_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
