/*
  Warnings:

  - The values [ASSEMBLY_VIDEO] on the enum `AssetRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
-- Montaj videoları S3 asset'i olmaktan çıkıp Product.assemblyVideoUrl üzerindeki
-- YouTube linkine taşındı; ASSEMBLY_VIDEO rolünü artık hiçbir kod okumuyor.
-- Kalan satırlar aşağıdaki USING cast'ini "invalid input value for enum" ile
-- düşürdüğü için enum daraltılmadan önce temizlenir. prod'da 0 satır → no-op.
-- NOT: S3'teki dosyalar burada silinmez, öksüz kalır (IMPROVEMENT_PLAN'da ayrı madde).
DELETE FROM "Asset" WHERE "role" = 'ASSEMBLY_VIDEO';
CREATE TYPE "AssetRole_new" AS ENUM ('PRIMARY', 'ANIMATION', 'GALLERY', 'DOCUMENT', 'TECHNICAL_DRAWING', 'MODEL_3D', 'CERTIFICATE');
ALTER TABLE "Asset" ALTER COLUMN "role" TYPE "AssetRole_new" USING ("role"::text::"AssetRole_new");
ALTER TYPE "AssetRole" RENAME TO "AssetRole_old";
ALTER TYPE "AssetRole_new" RENAME TO "AssetRole";
DROP TYPE "public"."AssetRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "assemblyVideoUrl" TEXT,
ADD COLUMN     "promoVideoUrl" TEXT;

-- RenameIndex
ALTER INDEX "ProductAttributeValueTranslation_productAttributeValueId_locale" RENAME TO "ProductAttributeValueTranslation_productAttributeValueId_lo_key";

-- RenameIndex
ALTER INDEX "ProductIndustrialUsageTranslation_locale_productIndustrialUsage" RENAME TO "ProductIndustrialUsageTranslation_locale_productIndustrialU_idx";

-- RenameIndex
ALTER INDEX "ProductIndustrialUsageTranslation_productIndustrialUsageId_loca" RENAME TO "ProductIndustrialUsageTranslation_productIndustrialUsageId__key";
