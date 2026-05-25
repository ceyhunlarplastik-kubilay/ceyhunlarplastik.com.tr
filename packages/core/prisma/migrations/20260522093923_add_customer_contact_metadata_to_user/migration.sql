-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customerContactDepartment" TEXT,
ADD COLUMN     "customerContactTitle" TEXT,
ADD COLUMN     "isPrimaryCustomerContact" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_customerId_isPrimaryCustomerContact_idx" ON "User"("customerId", "isPrimaryCustomerContact");
