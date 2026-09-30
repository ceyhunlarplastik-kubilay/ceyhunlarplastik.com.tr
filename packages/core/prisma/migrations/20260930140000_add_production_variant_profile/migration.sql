-- Varyantın üretim bilgisi: varyanta özel çevrim süresi (katalog ProductVariant'a dokunulmaz).
CREATE TABLE "ProductionVariantProfile" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "cycleTimeSec" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionVariantProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductionVariantProfile_variantId_key" ON "ProductionVariantProfile"("variantId");

ALTER TABLE "ProductionVariantProfile" ADD CONSTRAINT "ProductionVariantProfile_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
