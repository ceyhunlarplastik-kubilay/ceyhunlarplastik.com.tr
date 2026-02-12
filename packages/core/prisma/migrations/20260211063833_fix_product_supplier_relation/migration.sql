/*
  Warnings:

  - You are about to drop the column `supplierCatalogCode` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productSupplierId,versionCode]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productSupplierId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_supplierId_fkey";

-- DropIndex
DROP INDEX "ProductVariant_productId_supplierCatalogCode_versionCode_key";

-- DropIndex
DROP INDEX "ProductVariant_supplierId_idx";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "supplierCatalogCode",
DROP COLUMN "supplierId",
ADD COLUMN     "productSupplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "catalogCode" TEXT NOT NULL,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSupplier_productId_idx" ON "ProductSupplier"("productId");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_idx" ON "ProductSupplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_productId_catalogCode_key" ON "ProductSupplier"("productId", "catalogCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_productId_supplierId_key" ON "ProductSupplier"("productId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productSupplierId_versionCode_key" ON "ProductVariant"("productSupplierId", "versionCode");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productSupplierId_fkey" FOREIGN KEY ("productSupplierId") REFERENCES "ProductSupplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
