DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductVariant_productId_versionCode_variantIndex_key'
  ) THEN
    ALTER TABLE "ProductVariant"
    DROP CONSTRAINT "ProductVariant_productId_versionCode_variantIndex_key";
  END IF;
END $$;

DROP INDEX IF EXISTS "ProductVariant_productId_versionCode_variantIndex_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductVariant_productId_supplierCode_versionCode_variantIndex_key'
  ) THEN
    ALTER TABLE "ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_supplierCode_versionCode_variantIndex_key"
    UNIQUE ("productId", "supplierCode", "versionCode", "variantIndex");
  END IF;
END $$;
