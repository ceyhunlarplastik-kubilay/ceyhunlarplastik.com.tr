/*
  Warnings:

  - You are about to drop the column `productId` on the `CustomerAssignedProduct` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId,productVariantId]` on the table `CustomerAssignedProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productVariantId` to the `CustomerAssignedProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomerAssignedProduct" DROP CONSTRAINT "CustomerAssignedProduct_productId_fkey";

-- DropIndex
DROP INDEX "CustomerAssignedProduct_customerId_productId_key";

-- DropIndex
DROP INDEX "CustomerAssignedProduct_productId_idx";

-- AlterTable
ALTER TABLE "CustomerAssignedProduct" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CustomerAssignedProduct_productVariantId_idx" ON "CustomerAssignedProduct"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAssignedProduct_customerId_productVariantId_key" ON "CustomerAssignedProduct"("customerId", "productVariantId");

-- AddForeignKey
ALTER TABLE "CustomerAssignedProduct" ADD CONSTRAINT "CustomerAssignedProduct_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
