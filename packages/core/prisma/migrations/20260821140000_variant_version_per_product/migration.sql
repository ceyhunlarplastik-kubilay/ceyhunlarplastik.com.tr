-- Versiyon sözlüğü GLOBAL değil, ÜRÜN MODELİ BAŞINA
--
-- Bir önceki migration (20260821120000) sözlüğü global yapmıştı. Global olmasının
-- gerekçesi "aynı kombinasyon her üründe aynı numarayı taşısın" idi; bedeli ise
-- numaraların ürün bazında seyrekleşmesiydi (bir üründe V1, V7, V23).
--
-- İş tarafı ürün modeli başına numaralandırmayı istiyor: "10.5 içinde Siyah +
-- Bakalit = V1". Ölçü koduyla aynı mantık — 10.5.1 ile 10.8.1 de farklı ölçülerdir.
--
-- Asıl hata ürün başına olmak DEĞİLDİ, her kayıtta 1..N yeniden numaralandırmaktı;
-- o kaldırıldı ve geri gelmiyor. Numara append-only, ve tanımsız kombinasyon
-- productVariantWriter tarafından reddediliyor (otomatik ekleme yok).
--
-- YIKICI: ProductVariant satırları ve sözlük kayıtları silinir. Global kayıtların
-- hangi ürüne ait olduğu türetilemez; kullanıcı varyantları zaten sıfırlıyor.
-- Cascade: ProductVariantSupplier, Asset(variantId), CustomerAssignedProduct,
--          CustomerVariantSpecialPrice, ProductVariantCampaignItem
-- SetNull: OrderItem.productVariantId, BusinessRequestItem.productVariantId

-- 1) Varyantları ve sözlüğü boşalt (m2m bağı FK cascade ile gider)
DELETE FROM "ProductVariant";
DELETE FROM "VariantVersion";

-- 2) Global tekillikler kalkıyor
DROP INDEX "VariantVersion_code_key";
DROP INDEX "VariantVersion_signature_key";

-- 3) Ürün bağı
ALTER TABLE "VariantVersion" ADD COLUMN "productId" TEXT NOT NULL;

-- 4) Ürün içinde tekillik
CREATE UNIQUE INDEX "VariantVersion_productId_code_key" ON "VariantVersion"("productId", "code");
CREATE UNIQUE INDEX "VariantVersion_productId_signature_key" ON "VariantVersion"("productId", "signature");
CREATE INDEX "VariantVersion_productId_code_idx" ON "VariantVersion"("productId", "code");

-- 5) Ürün silinince sözlüğü de gider
ALTER TABLE "VariantVersion" ADD CONSTRAINT "VariantVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
