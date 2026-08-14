-- Kampanya duyurusu: satış temsilcisinin seçtiği müşterilere sıcak temas listesi.
-- Kampanya oluşturulduğunda otomatik bildirim GİTMEZ; temsilci bilinçli olarak
-- müşteri seçer, sistem yalnız takip kaydını tutar.
--
-- Bu aşamada hiçbir otomatik ileti gönderilmediği için gönderim/sağlayıcı alanları
-- (ör. providerMessageId) BİLİNÇLİ olarak yok — otomatik gönderime geçildiğinde
-- eklemeli migration yeterli.

-- CreateEnum
CREATE TYPE "CampaignAnnouncementChannel" AS ENUM ('MANUAL', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CampaignAnnouncementRecipientStatus" AS ENUM ('PENDING', 'REACHED', 'RESPONDED', 'NOT_INTERESTED', 'UNREACHABLE');

-- CreateTable
CREATE TABLE "CampaignAnnouncement" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAnnouncementRecipient" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" "CampaignAnnouncementChannel" NOT NULL,
    "status" "CampaignAnnouncementRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "contactedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignAnnouncementRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignAnnouncement_campaignId_createdAt_idx" ON "CampaignAnnouncement"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignAnnouncement_createdByUserId_createdAt_idx" ON "CampaignAnnouncement"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignAnnouncementRecipient_customerId_createdAt_idx" ON "CampaignAnnouncementRecipient"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignAnnouncementRecipient_announcementId_status_idx" ON "CampaignAnnouncementRecipient"("announcementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAnnouncementRecipient_announcementId_customerId_key" ON "CampaignAnnouncementRecipient"("announcementId", "customerId");

-- AddForeignKey
ALTER TABLE "CampaignAnnouncement" ADD CONSTRAINT "CampaignAnnouncement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ProductVariantCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnnouncement" ADD CONSTRAINT "CampaignAnnouncement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnnouncementRecipient" ADD CONSTRAINT "CampaignAnnouncementRecipient_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "CampaignAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnnouncementRecipient" ADD CONSTRAINT "CampaignAnnouncementRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
