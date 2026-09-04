-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "productSupplierCodeId" TEXT;

-- CreateIndex
CREATE INDEX "Asset_productSupplierCodeId_idx" ON "Asset"("productSupplierCodeId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productSupplierCodeId_fkey" FOREIGN KEY ("productSupplierCodeId") REFERENCES "ProductSupplierCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
