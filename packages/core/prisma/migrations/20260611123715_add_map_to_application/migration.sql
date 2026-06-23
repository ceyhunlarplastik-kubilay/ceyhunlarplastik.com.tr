-- CreateEnum
CREATE TYPE "CustomerAddressLocationSource" AS ENUM ('MANUAL_PIN', 'GEOCODED', 'IMPORTED', 'CUSTOMER_SUBMITTED');

-- CreateEnum
CREATE TYPE "CustomerAddressLocationAccuracy" AS ENUM ('EXACT', 'STREET', 'DISTRICT', 'CITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GeocodingCacheQueryType" AS ENUM ('SEARCH', 'REVERSE');

-- AlterTable
ALTER TABLE "CustomerAddress" ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "geocodingLabel" TEXT,
ADD COLUMN     "geocodingPlaceId" TEXT,
ADD COLUMN     "geocodingProvider" TEXT,
ADD COLUMN     "geocodingRaw" JSONB,
ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "locationAccuracy" "CustomerAddressLocationAccuracy",
ADD COLUMN     "locationSource" "CustomerAddressLocationSource",
ADD COLUMN     "locationVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "locationVerifiedByUserId" TEXT,
ADD COLUMN     "longitude" DECIMAL(11,8);

-- CreateTable
CREATE TABLE "GeocodingCache" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "queryType" "GeocodingCacheQueryType" NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeocodingCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeocodingCache_expiresAt_idx" ON "GeocodingCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeocodingCache_provider_queryType_cacheKey_key" ON "GeocodingCache"("provider", "queryType", "cacheKey");

-- CreateIndex
CREATE INDEX "CustomerAddress_latitude_longitude_idx" ON "CustomerAddress"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "CustomerAddress_locationVerifiedByUserId_idx" ON "CustomerAddress"("locationVerifiedByUserId");

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_locationVerifiedByUserId_fkey" FOREIGN KEY ("locationVerifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
