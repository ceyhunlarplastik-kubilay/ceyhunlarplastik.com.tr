-- Favori ürün varyantları iki kaynaktan beslenir: temsilci/admin ataması (STAFF)
-- ve müşterinin kendi kalp işareti (CUSTOMER). Aynı varyant iki kaynakta da
-- bulunabildiği için tekillik kısıtı `source` sütununu içerir.
--
-- Geri doldurma ayrı bir adım GEREKTİRMEZ: bugüne kadarki tüm satırlar temsilci
-- ataması olduğu için NOT NULL DEFAULT 'STAFF' mevcut satırları doğru işaretler.

-- CreateEnum
CREATE TYPE "CustomerAssignedProductSource" AS ENUM ('STAFF', 'CUSTOMER');

-- AlterTable
ALTER TABLE "CustomerAssignedProduct" ADD COLUMN     "source" "CustomerAssignedProductSource" NOT NULL DEFAULT 'STAFF';

-- DropIndex
DROP INDEX "CustomerAssignedProduct_customerId_productVariantId_key";

-- DropIndex
DROP INDEX "CustomerAssignedProduct_customerId_displayOrder_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAssignedProduct_customerId_productVariantId_source_key" ON "CustomerAssignedProduct"("customerId", "productVariantId", "source");

-- CreateIndex
CREATE INDEX "CustomerAssignedProduct_customerId_source_displayOrder_idx" ON "CustomerAssignedProduct"("customerId", "source", "displayOrder");
