/*
  Warnings:

  - You are about to drop the column `unit` on the `MeasurementType` table. All the data in the column will be lost.
  - Added the required column `baseUnit` to the `MeasurementType` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `code` on the `MeasurementType` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `label` on table `ProductMeasurement` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MeasurementCode" AS ENUM ('D', 'L', 'T', 'A', 'W', 'H');

-- AlterTable
ALTER TABLE "MeasurementType" DROP COLUMN "unit",
ADD COLUMN     "baseUnit" TEXT NOT NULL,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "code",
ADD COLUMN     "code" "MeasurementCode" NOT NULL;

-- AlterTable
ALTER TABLE "ProductMeasurement" ALTER COLUMN "label" SET NOT NULL,
ALTER COLUMN "label" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementType_code_key" ON "MeasurementType"("code");

-- CreateIndex
CREATE INDEX "ProductMeasurement_measurementTypeId_value_idx" ON "ProductMeasurement"("measurementTypeId", "value");
