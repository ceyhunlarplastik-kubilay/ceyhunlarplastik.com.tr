-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MeasurementCode" ADD VALUE 'D1';
ALTER TYPE "MeasurementCode" ADD VALUE 'D2';
ALTER TYPE "MeasurementCode" ADD VALUE 'R';
ALTER TYPE "MeasurementCode" ADD VALUE 'R1';
ALTER TYPE "MeasurementCode" ADD VALUE 'R2';
ALTER TYPE "MeasurementCode" ADD VALUE 'L1';
ALTER TYPE "MeasurementCode" ADD VALUE 'L2';
ALTER TYPE "MeasurementCode" ADD VALUE 'H1';
ALTER TYPE "MeasurementCode" ADD VALUE 'H2';
ALTER TYPE "MeasurementCode" ADD VALUE 'PT';
ALTER TYPE "MeasurementCode" ADD VALUE 'M';
ALTER TYPE "MeasurementCode" ADD VALUE 'R_L';
