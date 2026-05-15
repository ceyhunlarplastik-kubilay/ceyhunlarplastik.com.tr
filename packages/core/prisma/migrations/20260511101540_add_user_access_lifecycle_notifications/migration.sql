-- CreateEnum
CREATE TYPE "UserAccessStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('ACCESS_STATUS_CHANGED', 'ROLE_CHANGED', 'ASSIGNMENT_CHANGED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessStatus" "UserAccessStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "accessStatusChangedAt" TIMESTAMP(3),
ADD COLUMN     "accessStatusChangedByUserId" TEXT,
ADD COLUMN     "accessStatusReason" TEXT;

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_readAt_createdAt_idx" ON "UserNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "User_accessStatus_createdAt_idx" ON "User"("accessStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
