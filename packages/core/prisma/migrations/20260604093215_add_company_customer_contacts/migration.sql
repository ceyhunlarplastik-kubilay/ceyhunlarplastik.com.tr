-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleLabel" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCompanyContactAssignment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyContactId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCompanyContactAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyContact_isActive_displayOrder_idx" ON "CompanyContact"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "CompanyContact_department_idx" ON "CompanyContact"("department");

-- CreateIndex
CREATE INDEX "CustomerCompanyContactAssignment_customerId_isActive_displa_idx" ON "CustomerCompanyContactAssignment"("customerId", "isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "CustomerCompanyContactAssignment_companyContactId_idx" ON "CustomerCompanyContactAssignment"("companyContactId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCompanyContactAssignment_customerId_companyContactI_key" ON "CustomerCompanyContactAssignment"("customerId", "companyContactId");

-- AddForeignKey
ALTER TABLE "CustomerCompanyContactAssignment" ADD CONSTRAINT "CustomerCompanyContactAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCompanyContactAssignment" ADD CONSTRAINT "CustomerCompanyContactAssignment_companyContactId_fkey" FOREIGN KEY ("companyContactId") REFERENCES "CompanyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
