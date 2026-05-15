-- CreateTable
CREATE TABLE "CustomerAssignedProduct" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAssignedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Turkiye',
    "city" TEXT NOT NULL,
    "district" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "postalCode" TEXT,
    "taxOffice" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isBilling" BOOLEAN NOT NULL DEFAULT false,
    "isShipping" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAssignedProduct_customerId_displayOrder_idx" ON "CustomerAssignedProduct"("customerId", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomerAssignedProduct_productId_idx" ON "CustomerAssignedProduct"("productId");

-- CreateIndex
CREATE INDEX "CustomerAssignedProduct_createdByUserId_idx" ON "CustomerAssignedProduct"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAssignedProduct_customerId_productId_key" ON "CustomerAssignedProduct"("customerId", "productId");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_displayOrder_idx" ON "CustomerAddress"("customerId", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_isPrimary_idx" ON "CustomerAddress"("customerId", "isPrimary");

-- AddForeignKey
ALTER TABLE "CustomerAssignedProduct" ADD CONSTRAINT "CustomerAssignedProduct_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAssignedProduct" ADD CONSTRAINT "CustomerAssignedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAssignedProduct" ADD CONSTRAINT "CustomerAssignedProduct_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
