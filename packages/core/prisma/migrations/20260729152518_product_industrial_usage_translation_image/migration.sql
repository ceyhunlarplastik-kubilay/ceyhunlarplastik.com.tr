-- AlterTable
ALTER TABLE "ProductIndustrialUsageTranslation" ADD COLUMN     "imageKey" TEXT,
ALTER COLUMN "usageFunction" DROP NOT NULL;
