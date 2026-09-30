-- Üretim planlama Dilim 3.5: vardiya ekibi, lot operatörleri ve lot notları. Yalnız ekleme
-- (yeni enum + 3 tablo); mevcut tablolara dokunulmaz. Operatöre bağlı satırlar Restrict:
-- kullanılan operatör silinmez, pasife alınır.

-- CreateEnum
CREATE TYPE "ProductionLotNoteCategory" AS ENUM ('GENERAL', 'QUALITY', 'MAINTENANCE', 'MATERIAL', 'HANDOVER');

-- CreateTable
CREATE TABLE "MachineShiftAssignment" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftCode" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLotOperator" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLotOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLotNote" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "category" "ProductionLotNoteCategory" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "authorUserId" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLotNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineShiftAssignment_shiftDate_shiftCode_idx" ON "MachineShiftAssignment"("shiftDate", "shiftCode");

-- CreateIndex
CREATE INDEX "MachineShiftAssignment_operatorId_shiftDate_idx" ON "MachineShiftAssignment"("operatorId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "MachineShiftAssignment_machineId_shiftDate_shiftCode_operat_key" ON "MachineShiftAssignment"("machineId", "shiftDate", "shiftCode", "operatorId");

-- CreateIndex
CREATE INDEX "ProductionLotOperator_operatorId_idx" ON "ProductionLotOperator"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLotOperator_lotId_operatorId_key" ON "ProductionLotOperator"("lotId", "operatorId");

-- CreateIndex
CREATE INDEX "ProductionLotNote_lotId_createdAt_idx" ON "ProductionLotNote"("lotId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductionLotNote_operatorId_idx" ON "ProductionLotNote"("operatorId");

-- AddForeignKey
ALTER TABLE "MachineShiftAssignment" ADD CONSTRAINT "MachineShiftAssignment_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineShiftAssignment" ADD CONSTRAINT "MachineShiftAssignment_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ProductionOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotOperator" ADD CONSTRAINT "ProductionLotOperator_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotOperator" ADD CONSTRAINT "ProductionLotOperator_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ProductionOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotNote" ADD CONSTRAINT "ProductionLotNote_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotNote" ADD CONSTRAINT "ProductionLotNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLotNote" ADD CONSTRAINT "ProductionLotNote_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ProductionOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

