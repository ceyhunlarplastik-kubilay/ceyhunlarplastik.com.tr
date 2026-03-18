-- CreateTable
CREATE TABLE "UsageArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToUsageArea" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToUsageArea_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ModelTypeToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModelTypeToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ConnectionTypeToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConnectionTypeToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageArea_name_key" ON "UsageArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelType_name_key" ON "ModelType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionType_name_key" ON "ConnectionType"("name");

-- CreateIndex
CREATE INDEX "_ProductToUsageArea_B_index" ON "_ProductToUsageArea"("B");

-- CreateIndex
CREATE INDEX "_ModelTypeToProduct_B_index" ON "_ModelTypeToProduct"("B");

-- CreateIndex
CREATE INDEX "_ConnectionTypeToProduct_B_index" ON "_ConnectionTypeToProduct"("B");

-- AddForeignKey
ALTER TABLE "_ProductToUsageArea" ADD CONSTRAINT "_ProductToUsageArea_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToUsageArea" ADD CONSTRAINT "_ProductToUsageArea_B_fkey" FOREIGN KEY ("B") REFERENCES "UsageArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelTypeToProduct" ADD CONSTRAINT "_ModelTypeToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ModelType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelTypeToProduct" ADD CONSTRAINT "_ModelTypeToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConnectionTypeToProduct" ADD CONSTRAINT "_ConnectionTypeToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ConnectionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConnectionTypeToProduct" ADD CONSTRAINT "_ConnectionTypeToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ProductVariant_productId_supplierCode_versionCode_variantIndex_" RENAME TO "ProductVariant_productId_supplierCode_versionCode_variantIn_key";
