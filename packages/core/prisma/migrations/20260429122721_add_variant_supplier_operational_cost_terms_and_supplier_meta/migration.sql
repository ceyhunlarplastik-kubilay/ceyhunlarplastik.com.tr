-- AlterTable
ALTER TABLE "ProductVariantSupplier" ADD COLUMN     "netCost" DECIMAL(10,2),
ADD COLUMN     "operationalCostRate" DECIMAL(5,2),
ADD COLUMN     "paymentTermDays" INTEGER,
ADD COLUMN     "supplierNote" TEXT,
ADD COLUMN     "supplierVariantCode" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "defaultPaymentTermDays" INTEGER;
