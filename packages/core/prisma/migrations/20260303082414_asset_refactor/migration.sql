/*
  Warnings:

  - You are about to drop the column `url` on the `Asset` table. All the data in the column will be lost.
  - Added the required column `key` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "url",
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_productId_idx" ON "Asset"("productId");

-- CreateIndex
CREATE INDEX "Asset_variantId_idx" ON "Asset"("variantId");
