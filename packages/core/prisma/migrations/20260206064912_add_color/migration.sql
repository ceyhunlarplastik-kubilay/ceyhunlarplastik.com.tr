-- CreateEnum
CREATE TYPE "ColorSystem" AS ENUM ('RAL', 'PANTONE', 'NCS', 'CUSTOM');

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "system" "ColorSystem" NOT NULL DEFAULT 'RAL',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "rgbR" INTEGER,
    "rgbG" INTEGER,
    "rgbB" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Color_system_code_key" ON "Color"("system", "code");
