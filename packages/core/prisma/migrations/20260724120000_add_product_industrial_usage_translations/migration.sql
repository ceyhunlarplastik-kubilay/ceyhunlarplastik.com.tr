-- CreateTable
CREATE TABLE "ProductIndustrialUsageTranslation" (
    "id" TEXT NOT NULL,
    "productIndustrialUsageId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "usageFunction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIndustrialUsageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductIndustrialUsageTranslation_productIndustrialUsageId_locale_key"
ON "ProductIndustrialUsageTranslation"("productIndustrialUsageId", "locale");

-- CreateIndex
CREATE INDEX "ProductIndustrialUsageTranslation_locale_productIndustrialUsageId_idx"
ON "ProductIndustrialUsageTranslation"("locale", "productIndustrialUsageId");

-- AddForeignKey
ALTER TABLE "ProductIndustrialUsageTranslation"
ADD CONSTRAINT "ProductIndustrialUsageTranslation_productIndustrialUsageId_fkey"
FOREIGN KEY ("productIndustrialUsageId") REFERENCES "ProductIndustrialUsage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
