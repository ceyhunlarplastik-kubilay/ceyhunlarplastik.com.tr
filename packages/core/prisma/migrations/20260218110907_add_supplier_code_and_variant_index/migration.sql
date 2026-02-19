/*
  Warnings:

  - A unique constraint covering the columns `[productId,versionCode,variantIndex]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supplierCode` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantIndex` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductVariant_productId_versionCode_key";

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "supplierCode" TEXT NOT NULL,
ADD COLUMN     "variantIndex" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_versionCode_variantIndex_key" ON "ProductVariant"("productId", "versionCode", "variantIndex");
