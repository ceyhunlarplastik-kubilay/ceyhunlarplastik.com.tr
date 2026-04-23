-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "productAttributeValueId" TEXT;

-- CreateIndex
CREATE INDEX "Asset_productAttributeValueId_idx" ON "Asset"("productAttributeValueId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productAttributeValueId_fkey" FOREIGN KEY ("productAttributeValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
