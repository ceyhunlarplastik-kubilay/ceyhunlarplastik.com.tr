/*
  Warnings:

  - You are about to drop the column `assignedPurchasingUserId` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the `SupplierApprovalRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "BusinessRequestEntityType" ADD VALUE 'CATEGORY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessRequestType" ADD VALUE 'SUPPLIER_CATEGORY_CREATE';
ALTER TYPE "BusinessRequestType" ADD VALUE 'SUPPLIER_PRODUCT_CREATE';
ALTER TYPE "BusinessRequestType" ADD VALUE 'SUPPLIER_VARIANT_CREATE';

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_assignedPurchasingUserId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierApprovalRequest" DROP CONSTRAINT "SupplierApprovalRequest_productVariantSupplierId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierApprovalRequest" DROP CONSTRAINT "SupplierApprovalRequest_requestedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierApprovalRequest" DROP CONSTRAINT "SupplierApprovalRequest_reviewedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierApprovalRequest" DROP CONSTRAINT "SupplierApprovalRequest_supplierId_fkey";

-- DropIndex
DROP INDEX "Supplier_assignedPurchasingUserId_createdAt_idx";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "assignedPurchasingUserId";

-- DropTable
DROP TABLE "SupplierApprovalRequest";

-- DropEnum
DROP TYPE "SupplierApprovalRequestStatus";

-- DropEnum
DROP TYPE "SupplierApprovalRequestType";

-- CreateTable
CREATE TABLE "_SupplierPurchasingAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SupplierPurchasingAssignments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SupplierPurchasingAssignments_B_index" ON "_SupplierPurchasingAssignments"("B");

-- AddForeignKey
ALTER TABLE "_SupplierPurchasingAssignments" ADD CONSTRAINT "_SupplierPurchasingAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupplierPurchasingAssignments" ADD CONSTRAINT "_SupplierPurchasingAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
