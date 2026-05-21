-- AlterTable
ALTER TABLE "CustomerAddress" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "countryId" INTEGER,
ADD COLUMN     "stateId" INTEGER;

-- CreateTable
CREATE TABLE "geo_countries" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iso3" TEXT,
    "iso2" TEXT NOT NULL,
    "numeric_code" TEXT,
    "phonecode" TEXT,
    "capital" TEXT,
    "currency" TEXT,
    "currency_name" TEXT,
    "currency_symbol" TEXT,
    "tld" TEXT,
    "native" TEXT,
    "population" BIGINT,
    "gdp" TEXT,
    "region" TEXT,
    "region_id" INTEGER,
    "subregion" TEXT,
    "subregion_id" INTEGER,
    "nationality" TEXT,
    "area_sq_km" TEXT,
    "postal_code_format" TEXT,
    "postal_code_regex" TEXT,
    "timezones" JSONB,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "emoji" TEXT,
    "emojiU" TEXT,
    "wikiDataId" TEXT,

    CONSTRAINT "geo_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_states" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" INTEGER NOT NULL,
    "country_code" TEXT,
    "country_name" TEXT,
    "iso2" TEXT,
    "iso3166_2" TEXT,
    "fips_code" TEXT,
    "type" TEXT,
    "level" TEXT,
    "parent_id" INTEGER,
    "native" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "timezone" TEXT,
    "wikiDataId" TEXT,
    "population" BIGINT,

    CONSTRAINT "geo_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_cities" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" INTEGER,
    "state_code" TEXT,
    "state_name" TEXT,
    "country_id" INTEGER NOT NULL,
    "country_code" TEXT,
    "country_name" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "native" TEXT,
    "type" TEXT,
    "level" TEXT,
    "parent_id" INTEGER,
    "population" BIGINT,
    "timezone" TEXT,
    "translations" JSONB,
    "wikiDataId" TEXT,

    CONSTRAINT "geo_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geo_countries_iso2_key" ON "geo_countries"("iso2");

-- CreateIndex
CREATE INDEX "geo_countries_name_idx" ON "geo_countries"("name");

-- CreateIndex
CREATE INDEX "geo_states_country_id_name_idx" ON "geo_states"("country_id", "name");

-- CreateIndex
CREATE INDEX "geo_states_country_code_idx" ON "geo_states"("country_code");

-- CreateIndex
CREATE INDEX "geo_cities_country_id_name_idx" ON "geo_cities"("country_id", "name");

-- CreateIndex
CREATE INDEX "geo_cities_state_id_name_idx" ON "geo_cities"("state_id", "name");

-- CreateIndex
CREATE INDEX "CustomerAddress_countryId_idx" ON "CustomerAddress"("countryId");

-- CreateIndex
CREATE INDEX "CustomerAddress_stateId_idx" ON "CustomerAddress"("stateId");

-- CreateIndex
CREATE INDEX "CustomerAddress_cityId_idx" ON "CustomerAddress"("cityId");

-- AddForeignKey
ALTER TABLE "geo_states" ADD CONSTRAINT "geo_states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "geo_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_cities" ADD CONSTRAINT "geo_cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "geo_countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_cities" ADD CONSTRAINT "geo_cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "geo_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "geo_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "geo_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "geo_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
