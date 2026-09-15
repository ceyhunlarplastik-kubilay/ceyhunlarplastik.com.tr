-- CreateEnum
CREATE TYPE "CustomerVisitType" AS ENUM ('IN_PERSON', 'PHONE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CustomerVisitOutcome" AS ENUM ('POSITIVE', 'FOLLOW_UP_NEEDED', 'NOT_INTERESTED', 'ORDER_PLACED');

-- AlterTable
ALTER TABLE "CustomerVisit" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "outcome" "CustomerVisitOutcome",
ADD COLUMN     "type" "CustomerVisitType" NOT NULL DEFAULT 'IN_PERSON';

-- CreateIndex
CREATE INDEX "CustomerVisit_addressId_idx" ON "CustomerVisit"("addressId");

-- CreateIndex
CREATE INDEX "CustomerVisit_nextActionAt_idx" ON "CustomerVisit"("nextActionAt");

-- AddForeignKey
ALTER TABLE "CustomerVisit" ADD CONSTRAINT "CustomerVisit_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
