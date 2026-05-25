-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "defaultPaymentTermDays" INTEGER,
ADD COLUMN     "generalDiscountPercent" DECIMAL(5,2),
ADD COLUMN     "paymentTermNote" TEXT;
