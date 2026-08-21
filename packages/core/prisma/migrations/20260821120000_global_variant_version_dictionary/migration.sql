-- Versiyon kodu (V1) ürün başına değil GLOBAL sözlükte
--
-- Sorun: ProductVersion ürün başına numaralandığı için bir ürüne yeni renk
-- eklemek o üründeki TÜM versiyon kodlarını kaydırıyordu (kodlar renk koduna göre
-- yeniden sıralanıyordu). Ölçü kodunun aksine versiyonun sıralanması için hiçbir
-- iş kuralı yok — yani o kayma saf zarardı ve dışarı çıkmış kodları (katalog,
-- teklif, tedarikçi siparişi) yanlış varyanta işaret eder hâle getiriyordu.
--
-- Çözüm: renk + hammadde kombinasyonu global bir sözlükte tutulur ve numarası
-- APPEND-ONLY'dur. "Siyah + Bakalit" hangi üründe geçerse geçsin aynı numarayı
-- taşır. Ürün başına numaralar seyrek görünebilir (V1, V7, V23) — bilinçli kabul.
--
-- YIKICI: ProductVariant satırları silinir (kullanıcı zaten sıfırlıyor).
-- Cascade: ProductVariantSupplier, Asset(variantId), CustomerAssignedProduct,
--          CustomerVariantSpecialPrice, ProductVariantCampaignItem
-- SetNull: OrderItem.productVariantId, BusinessRequestItem.productVariantId

-- 1) Varyant verisini boşalt
DELETE FROM "ProductVariant";

-- 2) Ürün başına versiyon kaydı ve hammadde bağı kalkıyor
DROP TABLE "_MaterialToProductVersion";
ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productVersionId_fkey";
DROP INDEX IF EXISTS "ProductVariant_productVersionId_idx";
ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_productSizeId_productVersionId_key";
DROP INDEX IF EXISTS "ProductVariant_productId_productSizeId_productVersionId_key";
DROP TABLE "ProductVersion";

-- 3) Global versiyon sözlüğü
CREATE TABLE "VariantVersion" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "colorId" TEXT,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VariantVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_MaterialToVariantVersion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MaterialToVariantVersion_AB_pkey" PRIMARY KEY ("A","B")
);

-- 4) ProductVariant global versiyona bağlanıyor
ALTER TABLE "ProductVariant"
    DROP COLUMN "productVersionId",
    ADD COLUMN "variantVersionId" TEXT NOT NULL;

-- 5) İndeksler
CREATE UNIQUE INDEX "VariantVersion_code_key" ON "VariantVersion"("code");
CREATE UNIQUE INDEX "VariantVersion_signature_key" ON "VariantVersion"("signature");
CREATE INDEX "VariantVersion_colorId_idx" ON "VariantVersion"("colorId");

CREATE INDEX "_MaterialToVariantVersion_B_index" ON "_MaterialToVariantVersion"("B");

CREATE INDEX "ProductVariant_variantVersionId_idx" ON "ProductVariant"("variantVersionId");
CREATE UNIQUE INDEX "ProductVariant_productId_productSizeId_variantVersionId_key" ON "ProductVariant"("productId", "productSizeId", "variantVersionId");

-- 6) Yabancı anahtarlar
ALTER TABLE "VariantVersion" ADD CONSTRAINT "VariantVersion_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_MaterialToVariantVersion" ADD CONSTRAINT "_MaterialToVariantVersion_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MaterialToVariantVersion" ADD CONSTRAINT "_MaterialToVariantVersion_B_fkey" FOREIGN KEY ("B") REFERENCES "VariantVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_variantVersionId_fkey" FOREIGN KEY ("variantVersionId") REFERENCES "VariantVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
