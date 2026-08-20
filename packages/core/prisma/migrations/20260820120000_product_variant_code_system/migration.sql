-- Varyant kod sistemi: 10.5.A.V1.8 -> 10.5.8.V1.A
--
-- Ölçü kodu artık operatörün elle girdiği `variantIndex` değil, ürün modeli
-- içinde tekilleştirilmiş bir ÖLÇÜ KAYDINDAN (ProductSize) türer. Renk+hammadde
-- ProductVersion'a, tedarikçi harfi ProductSupplierCode'a taşınır; tedarikçili
-- tam kod ProductVariantSupplier üzerinde tutulur.
--
-- YIKICI: mevcut tüm ProductVariant satırları silinir. prod'da hiç varyant kaydı
-- yok; kubi/dev'deki kayıtlar test verisidir. Silme, bağlı satırları da götürür:
--   CASCADE  -> ProductVariantSupplier, ProductMeasurement, Asset(variantId),
--               CustomerAssignedProduct, CustomerVariantSpecialPrice,
--               ProductVariantCampaignItem
--   SET NULL -> OrderItem.productVariantId, BusinessRequestItem.productVariantId
--               (sipariş/talep kalemleri korunur; ikisinde de `data` snapshot'ı var)

-- 1) Varyant verisini boşalt
DELETE FROM "ProductVariant";

-- 2) Ölçüler artık varyanta değil ürün modelinin ölçü kaydına bağlı
DROP TABLE "ProductMeasurement";

-- 3) Hammadde m2m'i ProductVariant'tan ProductVersion'a taşınıyor
DROP TABLE "_MaterialToProductVariant";

-- 4) ProductVariant yeniden tanımlanıyor
ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_colorId_fkey";
DROP INDEX IF EXISTS "ProductVariant_colorId_idx";
ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_supplierCode_versionCode_variantIn_key";
DROP INDEX IF EXISTS "ProductVariant_productId_supplierCode_versionCode_variantIn_key";

ALTER TABLE "ProductVariant"
    DROP COLUMN "versionCode",
    DROP COLUMN "supplierCode",
    DROP COLUMN "variantIndex",
    DROP COLUMN "colorId",
    ADD COLUMN "productSizeId" TEXT NOT NULL,
    ADD COLUMN "productVersionId" TEXT NOT NULL;

-- 5) Ürün modeli: kod kilidi
ALTER TABLE "Product"
    ADD COLUMN "variantCodesLockedAt" TIMESTAMP(3),
    ADD COLUMN "variantCodesLockedByUserId" TEXT;

-- 6) Tedarikçi satırı: kod + tedarikçiye özel ürün/lojistik alanları
ALTER TABLE "ProductVariantSupplier"
    ADD COLUMN "supplierCode" TEXT,
    ADD COLUMN "fullCode" TEXT,
    ADD COLUMN "hasSupplierLogo" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "unitsPerPackage" INTEGER,
    ADD COLUMN "packageLengthMm" DECIMAL(10,2),
    ADD COLUMN "packageWidthMm" DECIMAL(10,2),
    ADD COLUMN "packageHeightMm" DECIMAL(10,2),
    ADD COLUMN "packageWeightKg" DECIMAL(10,3),
    ADD COLUMN "minLeadTimeDays" INTEGER;

-- 7) Yeni tablolar
CREATE TABLE "ProductMeasurementRequirement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "measurementTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortPriority" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductMeasurementRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductMeasurementRequirementTranslation" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductMeasurementRequirementTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "sortKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSizeValue" (
    "id" TEXT NOT NULL,
    "productSizeId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductSizeValue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVersion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "colorId" TEXT,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSupplierCode" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductSupplierCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_MaterialToProductVersion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MaterialToProductVersion_AB_pkey" PRIMARY KEY ("A","B")
);

-- 8) İndeksler
CREATE INDEX "ProductVariant_productSizeId_idx" ON "ProductVariant"("productSizeId");
CREATE INDEX "ProductVariant_productVersionId_idx" ON "ProductVariant"("productVersionId");
CREATE UNIQUE INDEX "ProductVariant_productId_productSizeId_productVersionId_key" ON "ProductVariant"("productId", "productSizeId", "productVersionId");

CREATE UNIQUE INDEX "ProductVariantSupplier_fullCode_key" ON "ProductVariantSupplier"("fullCode");
CREATE INDEX "ProductVariantSupplier_supplierCode_idx" ON "ProductVariantSupplier"("supplierCode");

CREATE INDEX "ProductMeasurementRequirement_productId_displayOrder_idx" ON "ProductMeasurementRequirement"("productId", "displayOrder");
CREATE INDEX "ProductMeasurementRequirement_measurementTypeId_idx" ON "ProductMeasurementRequirement"("measurementTypeId");
CREATE UNIQUE INDEX "ProductMeasurementRequirement_productId_measurementTypeId_l_key" ON "ProductMeasurementRequirement"("productId", "measurementTypeId", "label");

CREATE INDEX "ProductMeasurementRequirementTranslation_locale_requirement_idx" ON "ProductMeasurementRequirementTranslation"("locale", "requirementId");
CREATE UNIQUE INDEX "ProductMeasurementRequirementTranslation_requirementId_loca_key" ON "ProductMeasurementRequirementTranslation"("requirementId", "locale");

CREATE INDEX "ProductSize_productId_sortKey_idx" ON "ProductSize"("productId", "sortKey");
CREATE UNIQUE INDEX "ProductSize_productId_signature_key" ON "ProductSize"("productId", "signature");
CREATE UNIQUE INDEX "ProductSize_productId_code_key" ON "ProductSize"("productId", "code");

CREATE INDEX "ProductSizeValue_requirementId_idx" ON "ProductSizeValue"("requirementId");
CREATE UNIQUE INDEX "ProductSizeValue_productSizeId_requirementId_key" ON "ProductSizeValue"("productSizeId", "requirementId");

CREATE INDEX "ProductVersion_productId_code_idx" ON "ProductVersion"("productId", "code");
CREATE INDEX "ProductVersion_colorId_idx" ON "ProductVersion"("colorId");
CREATE UNIQUE INDEX "ProductVersion_productId_signature_key" ON "ProductVersion"("productId", "signature");
CREATE UNIQUE INDEX "ProductVersion_productId_code_key" ON "ProductVersion"("productId", "code");

CREATE INDEX "ProductSupplierCode_supplierId_idx" ON "ProductSupplierCode"("supplierId");
CREATE UNIQUE INDEX "ProductSupplierCode_productId_supplierId_key" ON "ProductSupplierCode"("productId", "supplierId");
CREATE UNIQUE INDEX "ProductSupplierCode_productId_code_key" ON "ProductSupplierCode"("productId", "code");

CREATE INDEX "_MaterialToProductVersion_B_index" ON "_MaterialToProductVersion"("B");

-- 9) Yabancı anahtarlar
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "ProductVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductMeasurementRequirement" ADD CONSTRAINT "ProductMeasurementRequirement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductMeasurementRequirement" ADD CONSTRAINT "ProductMeasurementRequirement_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductMeasurementRequirementTranslation" ADD CONSTRAINT "ProductMeasurementRequirementTranslation_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ProductMeasurementRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductSizeValue" ADD CONSTRAINT "ProductSizeValue_productSizeId_fkey" FOREIGN KEY ("productSizeId") REFERENCES "ProductSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSizeValue" ADD CONSTRAINT "ProductSizeValue_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ProductMeasurementRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductSupplierCode" ADD CONSTRAINT "ProductSupplierCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSupplierCode" ADD CONSTRAINT "ProductSupplierCode_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_MaterialToProductVersion" ADD CONSTRAINT "_MaterialToProductVersion_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MaterialToProductVersion" ADD CONSTRAINT "_MaterialToProductVersion_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
