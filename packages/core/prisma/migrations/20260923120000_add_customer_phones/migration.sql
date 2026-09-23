-- CreateTable
CREATE TABLE "CustomerPhone" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerPhone_customerId_displayOrder_idx" ON "CustomerPhone"("customerId", "displayOrder");

-- AddForeignKey
ALTER TABLE "CustomerPhone" ADD CONSTRAINT "CustomerPhone_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
