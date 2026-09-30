-- Tedarikçide "kendi üretimimiz" işareti: üretim planlama yalnız bu tedarikçinin varyantlarını üretime alır.
ALTER TABLE "Supplier" ADD COLUMN "isInHouseProduction" BOOLEAN NOT NULL DEFAULT false;
