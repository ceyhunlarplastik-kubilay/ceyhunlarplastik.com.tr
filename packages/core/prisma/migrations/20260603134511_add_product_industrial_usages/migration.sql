-- CreateTable
CREATE TABLE "ProductIndustrialUsage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sectorValueId" TEXT,
    "productionGroupValueId" TEXT,
    "usageAreaValueId" TEXT,
    "usageFunction" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIndustrialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductIndustrialUsage_productId_displayOrder_idx" ON "ProductIndustrialUsage"("productId", "displayOrder");

-- CreateIndex
CREATE INDEX "ProductIndustrialUsage_sectorValueId_idx" ON "ProductIndustrialUsage"("sectorValueId");

-- CreateIndex
CREATE INDEX "ProductIndustrialUsage_productionGroupValueId_idx" ON "ProductIndustrialUsage"("productionGroupValueId");

-- CreateIndex
CREATE INDEX "ProductIndustrialUsage_usageAreaValueId_idx" ON "ProductIndustrialUsage"("usageAreaValueId");

-- AddForeignKey
ALTER TABLE "ProductIndustrialUsage" ADD CONSTRAINT "ProductIndustrialUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIndustrialUsage" ADD CONSTRAINT "ProductIndustrialUsage_sectorValueId_fkey" FOREIGN KEY ("sectorValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIndustrialUsage" ADD CONSTRAINT "ProductIndustrialUsage_productionGroupValueId_fkey" FOREIGN KEY ("productionGroupValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIndustrialUsage" ADD CONSTRAINT "ProductIndustrialUsage_usageAreaValueId_fkey" FOREIGN KEY ("usageAreaValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
