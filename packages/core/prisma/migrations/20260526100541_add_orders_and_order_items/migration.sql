-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('APPROVED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'APPROVED',
    "title" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "sourceRequestId" TEXT,
    "shippingAddressId" TEXT,
    "shippingAddressLabel" TEXT,
    "shippingAddressSnapshot" JSONB,
    "referenceCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(5,2),
    "listSubtotal" DECIMAL(12,2),
    "customerSubtotal" DECIMAL(12,2),
    "requestedDeliveryDate" TIMESTAMP(3),
    "paymentTermDays" INTEGER,
    "paymentTermNote" TEXT,
    "commercialNote" TEXT,
    "negotiationNote" TEXT,
    "approvedFromRequestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "listUnitPrice" DECIMAL(12,2),
    "customerUnitPrice" DECIMAL(12,2),
    "listLineTotal" DECIMAL(12,2),
    "customerLineTotal" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "note" TEXT,
    "data" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sourceRequestId_key" ON "Order"("sourceRequestId");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_requestedByUserId_createdAt_idx" ON "Order"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_displayOrder_idx" ON "OrderItem"("orderId", "displayOrder");

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sourceRequestId_fkey" FOREIGN KEY ("sourceRequestId") REFERENCES "BusinessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
