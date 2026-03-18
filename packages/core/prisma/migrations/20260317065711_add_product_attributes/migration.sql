/*
  Warnings:

  - You are about to drop the `ConnectionType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsageArea` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ConnectionTypeToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ModelTypeToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductToUsageArea` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ConnectionTypeToProduct" DROP CONSTRAINT "_ConnectionTypeToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_ConnectionTypeToProduct" DROP CONSTRAINT "_ConnectionTypeToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_ModelTypeToProduct" DROP CONSTRAINT "_ModelTypeToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_ModelTypeToProduct" DROP CONSTRAINT "_ModelTypeToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToUsageArea" DROP CONSTRAINT "_ProductToUsageArea_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToUsageArea" DROP CONSTRAINT "_ProductToUsageArea_B_fkey";

-- DropTable
DROP TABLE "ConnectionType";

-- DropTable
DROP TABLE "ModelType";

-- DropTable
DROP TABLE "UsageArea";

-- DropTable
DROP TABLE "_ConnectionTypeToProduct";

-- DropTable
DROP TABLE "_ModelTypeToProduct";

-- DropTable
DROP TABLE "_ProductToUsageArea";

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToProductAttributeValue" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToProductAttributeValue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_code_key" ON "ProductAttribute"("code");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_idx" ON "ProductAttributeValue"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValue_attributeId_name_key" ON "ProductAttributeValue"("attributeId", "name");

-- CreateIndex
CREATE INDEX "_ProductToProductAttributeValue_B_index" ON "_ProductToProductAttributeValue"("B");

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductAttributeValue" ADD CONSTRAINT "_ProductToProductAttributeValue_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductAttributeValue" ADD CONSTRAINT "_ProductToProductAttributeValue_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
