-- `ProductSize.signature` artık ZORUNLU ölçü imzasını tutuyor
--
-- Önceki davranış (20260826140000_product_size_per_supplier): ölçü "tüm dolu
-- değerler + tedarikçi" anahtarıyla tekilleşiyordu; aynı zorunlu ölçüyü farklı
-- tedarikçiler girince üç ayrı `ProductSize` (1.23.1 / 1.23.2 / 1.23.3) oluşuyordu.
--
-- Yeni kural: zorunlu ölçüleri eşleşen varyantlar TEK `ProductSize`'a, tek koda
-- çözülür (`1.23.1.V1.A` / `.B` / `.C`). Opsiyonel ölçü değerleri yine
-- `ProductSizeValue`'da tutulur ama kodu belirlemez.
--
-- Tekilleştirme UYGULAMA katmanındadır (`productVariantWriter` +
-- `buildRequiredSignature`); DB'de `signature` üzerinde unique KISIT YOK — yalnız
-- arama/eşleştirmeyi hızlandıran bir index eklenir.
--
-- YIKICI DEĞİL: yalnız bir index ekler. Mevcut kayıtların `signature` alanını bu
-- migration DEĞİŞTİRMEZ; birleştirme + yeniden kodlama tek seferlik backfill
-- script'iyle yapılır (`npm run backfill:recode-product-sizes -w @ceyhunlarweb/core`).

CREATE INDEX "ProductSize_productId_signature_idx" ON "ProductSize"("productId", "signature");
