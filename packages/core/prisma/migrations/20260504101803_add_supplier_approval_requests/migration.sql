-- CreateEnum
CREATE TYPE "SupplierApprovalRequestType" AS ENUM ('SUPPLIER_PROFILE_UPDATE', 'VARIANT_PRICING_UPDATE');

-- CreateEnum
CREATE TYPE "SupplierApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "SupplierApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" "SupplierApprovalRequestType" NOT NULL,
    "status" "SupplierApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "supplierId" TEXT NOT NULL,
    "productVariantSupplierId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "workflowExecutionArn" TEXT,
    "workflowTaskToken" TEXT,
    "requestPayload" JSONB NOT NULL,
    "currentSnapshot" JSONB,
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierApprovalRequest_workflowExecutionArn_key" ON "SupplierApprovalRequest"("workflowExecutionArn");

-- CreateIndex
CREATE INDEX "SupplierApprovalRequest_status_createdAt_idx" ON "SupplierApprovalRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierApprovalRequest_supplierId_status_createdAt_idx" ON "SupplierApprovalRequest"("supplierId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierApprovalRequest_productVariantSupplierId_status_idx" ON "SupplierApprovalRequest"("productVariantSupplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierApprovalRequest_requestedByUserId_createdAt_idx" ON "SupplierApprovalRequest"("requestedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupplierApprovalRequest" ADD CONSTRAINT "SupplierApprovalRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierApprovalRequest" ADD CONSTRAINT "SupplierApprovalRequest_productVariantSupplierId_fkey" FOREIGN KEY ("productVariantSupplierId") REFERENCES "ProductVariantSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierApprovalRequest" ADD CONSTRAINT "SupplierApprovalRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierApprovalRequest" ADD CONSTRAINT "SupplierApprovalRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
