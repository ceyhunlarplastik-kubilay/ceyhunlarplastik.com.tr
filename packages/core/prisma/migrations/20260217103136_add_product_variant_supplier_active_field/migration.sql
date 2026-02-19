/*
  Warnings:

  - You are about to drop the `_ProductSupplierToProductVariant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProductSupplierToProductVariant" DROP CONSTRAINT "_ProductSupplierToProductVariant_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductSupplierToProductVariant" DROP CONSTRAINT "_ProductSupplierToProductVariant_B_fkey";

-- AlterTable
ALTER TABLE "ProductSupplier" ADD COLUMN     "productVariantId" TEXT;

-- DropTable
DROP TABLE "_ProductSupplierToProductVariant";

-- CreateTable
CREATE TABLE "ProductVariantSupplier" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantSupplier_variantId_idx" ON "ProductVariantSupplier"("variantId");

-- CreateIndex
CREATE INDEX "ProductVariantSupplier_supplierId_idx" ON "ProductVariantSupplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantSupplier_variantId_supplierId_key" ON "ProductVariantSupplier"("variantId", "supplierId");

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantSupplier" ADD CONSTRAINT "ProductVariantSupplier_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantSupplier" ADD CONSTRAINT "ProductVariantSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
