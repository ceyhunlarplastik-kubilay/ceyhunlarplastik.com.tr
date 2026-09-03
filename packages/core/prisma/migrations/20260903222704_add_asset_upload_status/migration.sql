-- CreateEnum
CREATE TYPE "AssetUploadStatus" AS ENUM ('PENDING_UPLOAD', 'ACTIVE');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "uploadStatus" "AssetUploadStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "uploadedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Asset_uploadStatus_createdAt_idx" ON "Asset"("uploadStatus", "createdAt");
