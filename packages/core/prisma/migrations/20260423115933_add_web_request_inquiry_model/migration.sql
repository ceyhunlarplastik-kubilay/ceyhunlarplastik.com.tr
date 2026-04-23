-- CreateEnum
CREATE TYPE "WebRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "WebRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "items" JSONB NOT NULL,
    "status" "WebRequestStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "WebRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebRequest_email_idx" ON "WebRequest"("email");

-- CreateIndex
CREATE INDEX "WebRequest_status_createdAt_idx" ON "WebRequest"("status", "createdAt");
