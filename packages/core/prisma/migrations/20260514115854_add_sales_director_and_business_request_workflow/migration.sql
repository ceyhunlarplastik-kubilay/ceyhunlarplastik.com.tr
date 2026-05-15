-- CreateEnum
CREATE TYPE "BusinessRequestDomain" AS ENUM ('SALES', 'PURCHASING');

-- CreateEnum
CREATE TYPE "BusinessRequestType" AS ENUM ('CUSTOMER_PROFILE_CHANGE', 'CUSTOMER_ORDER_REQUEST', 'CUSTOMER_DOCUMENT_REQUEST', 'CUSTOMER_PRICING_REQUEST', 'SUPPLIER_PROFILE_CHANGE', 'SUPPLIER_PRICING_CHANGE', 'SUPPLIER_CAPABILITY_CHANGE', 'OFFER_DISCOUNT_REQUEST', 'PAYMENT_TERM_REQUEST');

-- CreateEnum
CREATE TYPE "BusinessRequestStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BusinessRequestEntityType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'PRODUCT', 'PRODUCT_VARIANT', 'ORDER', 'OFFER', 'PAYMENT_TERM', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessRequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('CUSTOMER', 'SUPPLIER', 'SALES', 'SALES_DIRECTOR', 'PURCHASING', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserNotificationType" ADD VALUE 'REQUEST_CREATED';
ALTER TYPE "UserNotificationType" ADD VALUE 'APPROVAL_REQUIRED';
ALTER TYPE "UserNotificationType" ADD VALUE 'REQUEST_DECIDED';

-- CreateTable
CREATE TABLE "BusinessRequest" (
    "id" TEXT NOT NULL,
    "domain" "BusinessRequestDomain" NOT NULL,
    "type" "BusinessRequestType" NOT NULL,
    "status" "BusinessRequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "priority" "BusinessRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "BusinessRequestEntityType",
    "entityId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "requesterRole" "ApprovalRole" NOT NULL,
    "workflowExecutionArn" TEXT,
    "workflowTaskToken" TEXT,
    "requestedData" JSONB NOT NULL,
    "currentSnapshot" JSONB,
    "completedSnapshot" JSONB,
    "decidedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "data" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRequestApprovalStep" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "requiredRole" "ApprovalRole" NOT NULL,
    "assignedUserId" TEXT,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRequestApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "actorUserId" TEXT,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRequest_workflowExecutionArn_key" ON "BusinessRequest"("workflowExecutionArn");

-- CreateIndex
CREATE INDEX "BusinessRequest_domain_status_createdAt_idx" ON "BusinessRequest"("domain", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequest_type_status_createdAt_idx" ON "BusinessRequest"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequest_requestedByUserId_createdAt_idx" ON "BusinessRequest"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequest_customerId_status_createdAt_idx" ON "BusinessRequest"("customerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequest_supplierId_status_createdAt_idx" ON "BusinessRequest"("supplierId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequestItem_requestId_displayOrder_idx" ON "BusinessRequestItem"("requestId", "displayOrder");

-- CreateIndex
CREATE INDEX "BusinessRequestItem_productVariantId_idx" ON "BusinessRequestItem"("productVariantId");

-- CreateIndex
CREATE INDEX "BusinessRequestApprovalStep_assignedUserId_status_createdAt_idx" ON "BusinessRequestApprovalStep"("assignedUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequestApprovalStep_requiredRole_status_createdAt_idx" ON "BusinessRequestApprovalStep"("requiredRole", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessRequestApprovalStep_decidedByUserId_createdAt_idx" ON "BusinessRequestApprovalStep"("decidedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRequestApprovalStep_requestId_stepOrder_key" ON "BusinessRequestApprovalStep"("requestId", "stepOrder");

-- CreateIndex
CREATE INDEX "ActivityLog_requestId_createdAt_idx" ON "ActivityLog"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_actorUserId_createdAt_idx" ON "ActivityLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_eventType_createdAt_idx" ON "ActivityLog"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "BusinessRequest" ADD CONSTRAINT "BusinessRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequest" ADD CONSTRAINT "BusinessRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequest" ADD CONSTRAINT "BusinessRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequestItem" ADD CONSTRAINT "BusinessRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BusinessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequestItem" ADD CONSTRAINT "BusinessRequestItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequestApprovalStep" ADD CONSTRAINT "BusinessRequestApprovalStep_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BusinessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequestApprovalStep" ADD CONSTRAINT "BusinessRequestApprovalStep_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRequestApprovalStep" ADD CONSTRAINT "BusinessRequestApprovalStep_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BusinessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
