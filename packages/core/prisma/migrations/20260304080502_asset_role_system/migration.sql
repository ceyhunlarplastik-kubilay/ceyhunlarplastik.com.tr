/*
  Warnings:

  - You are about to drop the column `isPrimary` on the `Asset` table. All the data in the column will be lost.
  - Added the required column `role` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetRole" AS ENUM ('PRIMARY', 'ANIMATION', 'GALLERY', 'DOCUMENT', 'TECHNICAL_DRAWING', 'CERTIFICATE');

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "isPrimary",
ADD COLUMN     "role" "AssetRole" NOT NULL;
