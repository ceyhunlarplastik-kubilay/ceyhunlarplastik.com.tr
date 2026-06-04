-- CreateEnum
CREATE TYPE "CustomerAttributeValueAssignmentSource" AS ENUM ('MANUAL', 'LEGACY_BACKFILL', 'SYSTEM');

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "isCustomerAssignable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CustomerAttributeValueAssignment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,
    "source" "CustomerAttributeValueAssignmentSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAttributeValueAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAttributeValueAssignment_customerId_idx" ON "CustomerAttributeValueAssignment"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAttributeValueAssignment_attributeValueId_idx" ON "CustomerAttributeValueAssignment"("attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAttributeValueAssignment_customerId_attributeValueI_key" ON "CustomerAttributeValueAssignment"("customerId", "attributeValueId");

-- AddForeignKey
ALTER TABLE "CustomerAttributeValueAssignment" ADD CONSTRAINT "CustomerAttributeValueAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAttributeValueAssignment" ADD CONSTRAINT "CustomerAttributeValueAssignment_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
