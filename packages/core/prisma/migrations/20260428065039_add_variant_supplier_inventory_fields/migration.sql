-- AlterTable
ALTER TABLE "ProductVariantSupplier" ADD COLUMN     "availabilityUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "minOrderQty" INTEGER,
ADD COLUMN     "stockQty" INTEGER;
