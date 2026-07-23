-- CreateTable
CREATE TABLE "ColorTranslation" (
    "id" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementTypeTranslation" (
    "id" TEXT NOT NULL,
    "measurementTypeId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementTypeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTranslation" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorTranslation_colorId_locale_key"
ON "ColorTranslation"("colorId", "locale");

-- CreateIndex
CREATE INDEX "ColorTranslation_locale_colorId_idx"
ON "ColorTranslation"("locale", "colorId");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementTypeTranslation_measurementTypeId_locale_key"
ON "MeasurementTypeTranslation"("measurementTypeId", "locale");

-- CreateIndex
CREATE INDEX "MeasurementTypeTranslation_locale_measurementTypeId_idx"
ON "MeasurementTypeTranslation"("locale", "measurementTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialTranslation_materialId_locale_key"
ON "MaterialTranslation"("materialId", "locale");

-- CreateIndex
CREATE INDEX "MaterialTranslation_locale_materialId_idx"
ON "MaterialTranslation"("locale", "materialId");

-- AddForeignKey
ALTER TABLE "ColorTranslation"
ADD CONSTRAINT "ColorTranslation_colorId_fkey"
FOREIGN KEY ("colorId") REFERENCES "Color"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementTypeTranslation"
ADD CONSTRAINT "MeasurementTypeTranslation_measurementTypeId_fkey"
FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTranslation"
ADD CONSTRAINT "MaterialTranslation_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "Material"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
