-- Üretim planlama Dilim 2.3: işler ve vardiya lotları. Yalnız ekleme (yeni enum + tablo).

-- CreateEnum
CREATE TYPE "ProductionJobStatus" AS ENUM ('PLANNED', 'RELEASED', 'SETUP', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionLotStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL,
    "lotBaseNumber" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "moldId" TEXT NOT NULL,
    "versionSignature" TEXT NOT NULL,
    "plannedShots" INTEGER NOT NULL,
    "setupStartAt" TIMESTAMP(3) NOT NULL,
    "productionStartAt" TIMESTAMP(3) NOT NULL,
    "plannedEndAt" TIMESTAMP(3) NOT NULL,
    "cycleTimeSec" DOUBLE PRECISION NOT NULL,
    "efficiencyPercent" INTEGER NOT NULL,
    "setupMinutes" INTEGER NOT NULL,
    "status" "ProductionJobStatus" NOT NULL DEFAULT 'PLANNED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJobOutput" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "moldOutputId" TEXT NOT NULL,
    "productSizeId" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "cavities" INTEGER NOT NULL,
    "plannedQuantity" INTEGER NOT NULL,
    "goodQuantity" INTEGER NOT NULL DEFAULT 0,
    "scrapQuantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionJobOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLot" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftCode" TEXT NOT NULL,
    "plannedStartAt" TIMESTAMP(3) NOT NULL,
    "plannedEndAt" TIMESTAMP(3) NOT NULL,
    "plannedShots" INTEGER NOT NULL,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "status" "ProductionLotStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLotOutput" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "jobOutputId" TEXT NOT NULL,
    "plannedQuantity" INTEGER NOT NULL,
    "goodQuantity" INTEGER NOT NULL DEFAULT 0,
    "scrapQuantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionLotOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_lotBaseNumber_key" ON "ProductionJob"("lotBaseNumber");

-- CreateIndex
CREATE INDEX "ProductionJob_machineId_setupStartAt_idx" ON "ProductionJob"("machineId", "setupStartAt");

-- CreateIndex
CREATE INDEX "ProductionJob_moldId_setupStartAt_idx" ON "ProductionJob"("moldId", "setupStartAt");

-- CreateIndex
CREATE INDEX "ProductionJob_status_idx" ON "ProductionJob"("status");

-- CreateIndex
CREATE INDEX "ProductionJobOutput_productionOrderId_idx" ON "ProductionJobOutput"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionJobOutput_productSizeId_idx" ON "ProductionJobOutput"("productSizeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJobOutput_jobId_moldOutputId_key" ON "ProductionJobOutput"("jobId", "moldOutputId");

-- CreateIndex
CREATE INDEX "ProductionLot_shiftDate_shiftCode_idx" ON "ProductionLot"("shiftDate", "shiftCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLot_jobId_sequence_key" ON "ProductionLot"("jobId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLotOutput_lotId_jobOutputId_key" ON "ProductionLotOutput"("lotId", "jobOutputId");

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "Mold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobOutput" ADD CONSTRAINT "ProductionJobOutput_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobOutput" ADD CONSTRAINT "ProductionJobOutput_moldOutputId_fkey" FOREIGN KEY ("moldOutputId") REFERENCES "MoldOutput"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobOutput" ADD CONSTRAINT "ProductionJobOutput_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotOutput" ADD CONSTRAINT "ProductionLotOutput_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotOutput" ADD CONSTRAINT "ProductionLotOutput_jobOutputId_fkey" FOREIGN KEY ("jobOutputId") REFERENCES "ProductionJobOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Lot kökü 1000'den başlar ("1000-1", "1000-2"…; kullanıcı örneği). Prisma sıra başlangıcını
-- şemada tutmaz; bu satır sürüklenme üretmez.
ALTER SEQUENCE "ProductionJob_lotBaseNumber_seq" RESTART WITH 1000;
