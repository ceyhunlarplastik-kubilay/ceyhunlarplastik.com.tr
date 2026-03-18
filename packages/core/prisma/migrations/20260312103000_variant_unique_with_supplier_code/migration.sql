ALTER TABLE "ProductVariant"
DROP CONSTRAINT IF EXISTS "ProductVariant_productId_versionCode_variantIndex_key";

ALTER TABLE "ProductVariant"
ADD CONSTRAINT "ProductVariant_productId_supplierCode_versionCode_variantIndex_key"
UNIQUE ("productId", "supplierCode", "versionCode", "variantIndex");
