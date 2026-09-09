-- "İlgili Ürünler" artık yalnızca profil eşleşmesinden türer (müşteri
-- sektör/üretim grubu/kullanım alanı ↔ ProductIndustrialUsage). Admin / satış
-- müdürü / satış temsilcisi manuel ürün seçimi kaldırıldığı için
-- CustomerFeaturedProduct tablosu tamamen düşürülüyor.

-- DropForeignKey
ALTER TABLE "CustomerFeaturedProduct" DROP CONSTRAINT "CustomerFeaturedProduct_customerId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerFeaturedProduct" DROP CONSTRAINT "CustomerFeaturedProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerFeaturedProduct" DROP CONSTRAINT "CustomerFeaturedProduct_createdByUserId_fkey";

-- DropTable
DROP TABLE "CustomerFeaturedProduct";
