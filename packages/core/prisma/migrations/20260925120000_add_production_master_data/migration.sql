-- CreateEnum
CREATE TYPE "ProductionMachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'BREAKDOWN', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MoldStatus" AS ENUM ('ACTIVE', 'IN_MAINTENANCE', 'BROKEN', 'RETIRED');

-- CreateEnum
CREATE TYPE "MoldOwnership" AS ENUM ('COMPANY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ProductionCalendarExceptionKind" AS ENUM ('HOLIDAY', 'SHUTDOWN', 'EXTRA_WORKDAY');

-- CreateEnum
CREATE TYPE "MachineDowntimeKind" AS ENUM ('PLANNED_MAINTENANCE', 'BREAKDOWN', 'OTHER');

-- CreateTable
CREATE TABLE "ProductionArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "shiftPatternId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMachine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "manufactureYear" INTEGER,
    "areaId" TEXT NOT NULL,
    "status" "ProductionMachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "clampForceTon" INTEGER NOT NULL,
    "tieBarHorizontalMm" INTEGER,
    "tieBarVerticalMm" INTEGER,
    "minMoldHeightMm" INTEGER,
    "maxMoldHeightMm" INTEGER,
    "maxOpeningStrokeMm" INTEGER,
    "shotCapacityG" DOUBLE PRECISION,
    "screwDiameterMm" INTEGER,
    "locatingRingDiameterMm" INTEGER,
    "hotRunnerZones" INTEGER NOT NULL DEFAULT 0,
    "coreCircuits" INTEGER NOT NULL DEFAULT 0,
    "hasRobot" BOOLEAN NOT NULL DEFAULT false,
    "plannedEfficiencyPercent" INTEGER NOT NULL DEFAULT 85,
    "hourlyCost" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "shiftPatternId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mold" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownership" "MoldOwnership" NOT NULL DEFAULT 'COMPANY',
    "ownerCustomerId" TEXT,
    "requiredClampForceTon" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "thicknessMm" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "requiredOpeningStrokeMm" INTEGER,
    "locatingRingDiameterMm" INTEGER,
    "hotRunnerZones" INTEGER NOT NULL DEFAULT 0,
    "coreCircuitsRequired" INTEGER NOT NULL DEFAULT 0,
    "requiresRobot" BOOLEAN NOT NULL DEFAULT false,
    "standardCycleTimeSec" DOUBLE PRECISION NOT NULL,
    "runnerWeightG" DOUBLE PRECISION,
    "expectedScrapPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setupMinutes" INTEGER NOT NULL DEFAULT 60,
    "totalShots" INTEGER NOT NULL DEFAULT 0,
    "maintenanceIntervalShots" INTEGER,
    "shotsAtLastMaintenance" INTEGER NOT NULL DEFAULT 0,
    "lastMaintenanceAt" TIMESTAMP(3),
    "storageLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldOutput" (
    "id" TEXT NOT NULL,
    "moldId" TEXT NOT NULL,
    "productSizeId" TEXT NOT NULL,
    "cavities" INTEGER NOT NULL,
    "partWeightG" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoldOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldMachineProfile" (
    "id" TEXT NOT NULL,
    "moldId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "cycleTimeSec" DOUBLE PRECISION,
    "setupMinutes" INTEGER,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoldMachineProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialProcessProfile" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "isMoldResin" BOOLEAN NOT NULL DEFAULT true,
    "family" TEXT,
    "densityGCm3" DOUBLE PRECISION,
    "requiresDrying" BOOLEAN NOT NULL DEFAULT false,
    "dryingTempC" INTEGER,
    "dryingHours" DOUBLE PRECISION,
    "cycleTimeFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "purgeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialProcessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftDefinition" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCalendarException" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" "ProductionCalendarExceptionKind" NOT NULL,
    "note" TEXT,
    "areaId" TEXT,
    "machineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCalendarException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineDowntime" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "kind" "MachineDowntimeKind" NOT NULL,
    "reason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineDowntime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOperator" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeNo" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOperator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionArea_code_key" ON "ProductionArea"("code");

-- CreateIndex
CREATE INDEX "ProductionArea_sortOrder_idx" ON "ProductionArea"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionMachine_code_key" ON "ProductionMachine"("code");

-- CreateIndex
CREATE INDEX "ProductionMachine_areaId_sortOrder_idx" ON "ProductionMachine"("areaId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Mold_code_key" ON "Mold"("code");

-- CreateIndex
CREATE INDEX "Mold_status_idx" ON "Mold"("status");

-- CreateIndex
CREATE INDEX "Mold_ownerCustomerId_idx" ON "Mold"("ownerCustomerId");

-- CreateIndex
CREATE INDEX "MoldOutput_productSizeId_idx" ON "MoldOutput"("productSizeId");

-- CreateIndex
CREATE UNIQUE INDEX "MoldOutput_moldId_productSizeId_key" ON "MoldOutput"("moldId", "productSizeId");

-- CreateIndex
CREATE INDEX "MoldMachineProfile_machineId_idx" ON "MoldMachineProfile"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MoldMachineProfile_moldId_machineId_key" ON "MoldMachineProfile"("moldId", "machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProcessProfile_materialId_key" ON "MaterialProcessProfile"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftPattern_name_key" ON "ShiftPattern"("name");

-- CreateIndex
CREATE INDEX "ShiftDefinition_patternId_sortOrder_idx" ON "ShiftDefinition"("patternId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftDefinition_patternId_code_key" ON "ShiftDefinition"("patternId", "code");

-- CreateIndex
CREATE INDEX "ProductionCalendarException_date_idx" ON "ProductionCalendarException"("date");

-- CreateIndex
CREATE INDEX "MachineDowntime_machineId_startAt_idx" ON "MachineDowntime"("machineId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOperator_employeeNo_key" ON "ProductionOperator"("employeeNo");

-- CreateIndex
CREATE INDEX "ProductionOperator_isActive_lastName_idx" ON "ProductionOperator"("isActive", "lastName");

-- AddForeignKey
ALTER TABLE "ProductionArea" ADD CONSTRAINT "ProductionArea_shiftPatternId_fkey" FOREIGN KEY ("shiftPatternId") REFERENCES "ShiftPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMachine" ADD CONSTRAINT "ProductionMachine_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "ProductionArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMachine" ADD CONSTRAINT "ProductionMachine_shiftPatternId_fkey" FOREIGN KEY ("shiftPatternId") REFERENCES "ShiftPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mold" ADD CONSTRAINT "Mold_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoldOutput" ADD CONSTRAINT "MoldOutput_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "Mold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoldOutput" ADD CONSTRAINT "MoldOutput_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoldMachineProfile" ADD CONSTRAINT "MoldMachineProfile_moldId_fkey" FOREIGN KEY ("moldId") REFERENCES "Mold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoldMachineProfile" ADD CONSTRAINT "MoldMachineProfile_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProcessProfile" ADD CONSTRAINT "MaterialProcessProfile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftDefinition" ADD CONSTRAINT "ShiftDefinition_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "ShiftPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCalendarException" ADD CONSTRAINT "ProductionCalendarException_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "ProductionArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCalendarException" ADD CONSTRAINT "ProductionCalendarException_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineDowntime" ADD CONSTRAINT "MachineDowntime_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineDowntime" ADD CONSTRAINT "MachineDowntime_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

