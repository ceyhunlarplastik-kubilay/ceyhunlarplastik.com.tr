-- Üretim planlama Dilim 4.2: vardiya raporu (saha girişi). Yalnız ekleme: duruş / fire nedeni
-- sözlüğü, lottaki fiili duruşlar, lot çıktısı fire kırılımı, lot rapor alanları ve iş durum
-- geçmişi. Nedenler Restrict: kullanılan neden silinmez, pasife alınır.

-- CreateEnum
CREATE TYPE "ProductionReasonKind" AS ENUM ('STOP', 'SCRAP');

-- CreateEnum
CREATE TYPE "ProductionStopCategory" AS ENUM ('PLANNED', 'BREAKDOWN', 'MATERIAL', 'QUALITY', 'PERSONNEL', 'OTHER');

-- AlterTable
ALTER TABLE "ProductionLot" ADD COLUMN     "actualShots" INTEGER,
ADD COLUMN     "reportedAt" TIMESTAMP(3),
ADD COLUMN     "reportedByUserId" TEXT;

-- CreateTable
CREATE TABLE "ProductionReason" (
    "id" TEXT NOT NULL,
    "kind" "ProductionReasonKind" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stopCategory" "ProductionStopCategory",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionStop" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "reasonId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLotScrap" (
    "id" TEXT NOT NULL,
    "lotOutputId" TEXT NOT NULL,
    "reasonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProductionLotScrap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJobStatusChange" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fromStatus" "ProductionJobStatus",
    "toStatus" "ProductionJobStatus" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "ProductionJobStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionReason_kind_isActive_sortOrder_idx" ON "ProductionReason"("kind", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionReason_kind_code_key" ON "ProductionReason"("kind", "code");

-- CreateIndex
CREATE INDEX "ProductionStop_lotId_idx" ON "ProductionStop"("lotId");

-- CreateIndex
CREATE INDEX "ProductionStop_reasonId_idx" ON "ProductionStop"("reasonId");

-- CreateIndex
CREATE INDEX "ProductionLotScrap_reasonId_idx" ON "ProductionLotScrap"("reasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLotScrap_lotOutputId_reasonId_key" ON "ProductionLotScrap"("lotOutputId", "reasonId");

-- CreateIndex
CREATE INDEX "ProductionJobStatusChange_jobId_occurredAt_idx" ON "ProductionJobStatusChange"("jobId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductionJobStatusChange_toStatus_occurredAt_idx" ON "ProductionJobStatusChange"("toStatus", "occurredAt");

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "ProductionReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStop" ADD CONSTRAINT "ProductionStop_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotScrap" ADD CONSTRAINT "ProductionLotScrap_lotOutputId_fkey" FOREIGN KEY ("lotOutputId") REFERENCES "ProductionLotOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotScrap" ADD CONSTRAINT "ProductionLotScrap_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "ProductionReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobStatusChange" ADD CONSTRAINT "ProductionJobStatusChange_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobStatusChange" ADD CONSTRAINT "ProductionJobStatusChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

