-- CreateTable
CREATE TABLE "CustomerVariantSpecialPrice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "minOrderQuantity" INTEGER,
    "maxOrderQuantity" INTEGER,
    "paymentTermDays" INTEGER,
    "paymentTermLabel" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "taxIncluded" BOOLEAN NOT NULL DEFAULT false,
    "deliveryTerm" TEXT,
    "contractReference" TEXT,
    "note" TEXT,
    "internalNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerVariantSpecialPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerVariantSpecialPrice_customerId_isActive_idx" ON "CustomerVariantSpecialPrice"("customerId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerVariantSpecialPrice_productVariantId_idx" ON "CustomerVariantSpecialPrice"("productVariantId");

-- CreateIndex
CREATE INDEX "CustomerVariantSpecialPrice_validFrom_validUntil_idx" ON "CustomerVariantSpecialPrice"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "CustomerVariantSpecialPrice_createdByUserId_idx" ON "CustomerVariantSpecialPrice"("createdByUserId");

-- CreateIndex
CREATE INDEX "CustomerVariantSpecialPrice_approvedByUserId_idx" ON "CustomerVariantSpecialPrice"("approvedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerVariantSpecialPrice_customerId_productVariantId_key" ON "CustomerVariantSpecialPrice"("customerId", "productVariantId");

-- AddForeignKey
ALTER TABLE "CustomerVariantSpecialPrice" ADD CONSTRAINT "CustomerVariantSpecialPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVariantSpecialPrice" ADD CONSTRAINT "CustomerVariantSpecialPrice_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVariantSpecialPrice" ADD CONSTRAINT "CustomerVariantSpecialPrice_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVariantSpecialPrice" ADD CONSTRAINT "CustomerVariantSpecialPrice_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
