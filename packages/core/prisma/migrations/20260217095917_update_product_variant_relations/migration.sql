/*
  Warnings:

  - You are about to drop the column `materialId` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `productSupplierId` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,versionCode]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_materialId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productSupplierId_fkey";

-- DropIndex
DROP INDEX "ProductVariant_materialId_idx";

-- DropIndex
DROP INDEX "ProductVariant_productSupplierId_versionCode_key";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "materialId",
DROP COLUMN "productSupplierId",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_ProductSupplierToProductVariant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductSupplierToProductVariant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MaterialToProductVariant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MaterialToProductVariant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductSupplierToProductVariant_B_index" ON "_ProductSupplierToProductVariant"("B");

-- CreateIndex
CREATE INDEX "_MaterialToProductVariant_B_index" ON "_MaterialToProductVariant"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_versionCode_key" ON "ProductVariant"("productId", "versionCode");

-- AddForeignKey
ALTER TABLE "_ProductSupplierToProductVariant" ADD CONSTRAINT "_ProductSupplierToProductVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductSupplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSupplierToProductVariant" ADD CONSTRAINT "_ProductSupplierToProductVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToProductVariant" ADD CONSTRAINT "_MaterialToProductVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToProductVariant" ADD CONSTRAINT "_MaterialToProductVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
