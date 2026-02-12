/*
  Warnings:

  - You are about to drop the column `material` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `supplierCode` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[variantId,measurementTypeId,label]` on the table `ProductMeasurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fullCode]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,supplierCatalogCode,versionCode]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullCode` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierCatalogCode` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'TECHNICAL_DRAWING', 'CERTIFICATE');

-- DropIndex
DROP INDEX "ProductVariant_productId_supplierCode_versionCode_key";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "material",
DROP COLUMN "supplierCode",
ADD COLUMN     "fullCode" TEXT NOT NULL,
ADD COLUMN     "materialId" TEXT,
ADD COLUMN     "supplierCatalogCode" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "categoryId" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMeasurement_variantId_measurementTypeId_label_key" ON "ProductMeasurement"("variantId", "measurementTypeId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_fullCode_key" ON "ProductVariant"("fullCode");

-- CreateIndex
CREATE INDEX "ProductVariant_supplierId_idx" ON "ProductVariant"("supplierId");

-- CreateIndex
CREATE INDEX "ProductVariant_materialId_idx" ON "ProductVariant"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_supplierCatalogCode_versionCode_key" ON "ProductVariant"("productId", "supplierCatalogCode", "versionCode");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
