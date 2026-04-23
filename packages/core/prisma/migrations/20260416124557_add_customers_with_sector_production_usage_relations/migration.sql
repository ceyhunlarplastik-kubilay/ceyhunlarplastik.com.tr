-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "sectorValueId" TEXT,
    "productionGroupValueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomerUsageAreas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerUsageAreas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_sectorValueId_idx" ON "Customer"("sectorValueId");

-- CreateIndex
CREATE INDEX "Customer_productionGroupValueId_idx" ON "Customer"("productionGroupValueId");

-- CreateIndex
CREATE INDEX "_CustomerUsageAreas_B_index" ON "_CustomerUsageAreas"("B");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_sectorValueId_fkey" FOREIGN KEY ("sectorValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_productionGroupValueId_fkey" FOREIGN KEY ("productionGroupValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerUsageAreas" ADD CONSTRAINT "_CustomerUsageAreas_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerUsageAreas" ADD CONSTRAINT "_CustomerUsageAreas_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
