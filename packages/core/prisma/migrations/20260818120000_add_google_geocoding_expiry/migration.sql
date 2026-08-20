-- Google Places kaynaklı koordinatlar en fazla 29 gün tutulur. Place ID kalıcıdır.
ALTER TABLE "CustomerAddress"
ADD COLUMN "geocodingExpiresAt" TIMESTAMP(3);

CREATE INDEX "CustomerAddress_geocodingProvider_geocodingExpiresAt_idx"
ON "CustomerAddress"("geocodingProvider", "geocodingExpiresAt");
