-- AlterTable
ALTER TABLE "ProductAttributeValue" ADD COLUMN     "parentValueId" TEXT;

-- CreateIndex
CREATE INDEX "ProductAttributeValue_parentValueId_idx" ON "ProductAttributeValue"("parentValueId");

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_parentValueId_fkey" FOREIGN KEY ("parentValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
