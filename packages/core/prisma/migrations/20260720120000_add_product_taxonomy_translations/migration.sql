-- CreateTable
CREATE TABLE "ProductAttributeTranslation" (
    "id" TEXT NOT NULL,
    "productAttributeId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValueTranslation" (
    "id" TEXT NOT NULL,
    "productAttributeValueId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "locale" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeValueTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeTranslation_productAttributeId_locale_key"
ON "ProductAttributeTranslation"("productAttributeId", "locale");

-- CreateIndex
CREATE INDEX "ProductAttributeTranslation_locale_productAttributeId_idx"
ON "ProductAttributeTranslation"("locale", "productAttributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValueTranslation_productAttributeValueId_locale_key"
ON "ProductAttributeValueTranslation"("productAttributeValueId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValueTranslation_attributeId_locale_slug_key"
ON "ProductAttributeValueTranslation"("attributeId", "locale", "slug");

-- CreateIndex
CREATE INDEX "ProductAttributeValueTranslation_locale_attributeId_idx"
ON "ProductAttributeValueTranslation"("locale", "attributeId");

-- AddForeignKey
ALTER TABLE "ProductAttributeTranslation"
ADD CONSTRAINT "ProductAttributeTranslation_productAttributeId_fkey"
FOREIGN KEY ("productAttributeId") REFERENCES "ProductAttribute"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValueTranslation"
ADD CONSTRAINT "ProductAttributeValueTranslation_productAttributeValueId_fkey"
FOREIGN KEY ("productAttributeValueId") REFERENCES "ProductAttributeValue"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValueTranslation"
ADD CONSTRAINT "ProductAttributeValueTranslation_attributeId_fkey"
FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
