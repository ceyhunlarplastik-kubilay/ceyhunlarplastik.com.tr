-- Kampanyalı ürün varyantları. Kampanya müşteriye özel DEĞİLDİR: tüm müşterilere
-- aynı yüzde indirimi açar. Başlık + kalem yapısı, çünkü stok eritme kampanyası
-- tipik olarak birden çok varyantı kapsar ve duyuru kampanya seviyesinde yapılır.

-- CreateEnum
CREATE TYPE "ProductVariantCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "ProductVariantCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "status" "ProductVariantCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantCampaignItem" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantCampaignItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantCampaign_status_validFrom_validUntil_idx" ON "ProductVariantCampaign"("status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "ProductVariantCampaign_createdByUserId_idx" ON "ProductVariantCampaign"("createdByUserId");

-- CreateIndex
CREATE INDEX "ProductVariantCampaignItem_productVariantId_idx" ON "ProductVariantCampaignItem"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductVariantCampaignItem_campaignId_displayOrder_idx" ON "ProductVariantCampaignItem"("campaignId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantCampaignItem_campaignId_productVariantId_key" ON "ProductVariantCampaignItem"("campaignId", "productVariantId");

-- AddForeignKey
ALTER TABLE "ProductVariantCampaign" ADD CONSTRAINT "ProductVariantCampaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCampaignItem" ADD CONSTRAINT "ProductVariantCampaignItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ProductVariantCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantCampaignItem" ADD CONSTRAINT "ProductVariantCampaignItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
