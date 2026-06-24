-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "materialId" TEXT;

-- CreateIndex
CREATE INDEX "Asset_materialId_idx" ON "Asset"("materialId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
