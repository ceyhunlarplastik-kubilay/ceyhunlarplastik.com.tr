-- Üretim planlama Dilim 2.1: üretim emirleri. Yalnız ekleme (yeni enum + tablo).

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ProductionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ProductionOrderSource" AS ENUM ('MANUAL', 'STOCK', 'CUSTOMER_ORDER');

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "productVariantId" TEXT,
    "variantCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dueDate" DATE,
    "priority" "ProductionPriority" NOT NULL DEFAULT 'NORMAL',
    "source" "ProductionOrderSource" NOT NULL DEFAULT 'MANUAL',
    "customerId" TEXT,
    "cycleTimeOverrideSec" DOUBLE PRECISION,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_orderNumber_key" ON "ProductionOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_dueDate_idx" ON "ProductionOrder"("status", "dueDate");

-- CreateIndex
CREATE INDEX "ProductionOrder_productVariantId_idx" ON "ProductionOrder"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductionOrder_customerId_idx" ON "ProductionOrder"("customerId");

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Emir numarası "UE-1001"den başlar (kullanıcı kararı, 2026-09-25). Prisma sıra başlangıcını
-- şemada tutmaz; bu satır sürüklenme (drift) üretmez.
ALTER SEQUENCE "ProductionOrder_orderNumber_seq" RESTART WITH 1001;
