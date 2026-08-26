-- Varyant kodları APPEND-ONLY: taslak/kilit kipi kaldırıldı
--
-- Önceki davranış iki kipliydi. TASLAK kipinde ürünün tüm ölçüleri her varyant
-- kaydında `sortKey`'e göre 1..N yeniden numaralanıyordu: araya 11 mm eklemek
-- 12 mm'i bir sonraki numaraya kaydırıyordu. KİLİTLİ kipte ise mevcut kodlar
-- sabit kalıp yeni ölçü sona ekleniyordu.
--
-- Artık tek davranış var ve o da kilitli kipin davranışı: kod ile ölçünün
-- büyüklüğü arasında bağ YOK, sıradaki numara verilir. Kodların kayabildiği her
-- yol dışarı çıkmış kodları (katalog, teklif, tedarikçi siparişi) yanlış varyanta
-- işaret eder hâle getiriyordu — versiyon numaralandırması da aynı gerekçeyle
-- kaldırılmıştı.
--
-- SIRALAMA ayrı bir eksene taşındı: listeler ölçüyü küçükten büyüğe göstermeye
-- devam eder ama koda değil `ProductSize.sortKey`'e bakar. O kolon zaten var ve
-- `@@index([productId, sortKey])` ile indeksli, bu yüzden ek şema değişikliği
-- gerekmiyor.
--
-- YIKICI DEĞİL: yalnız iki kullanılmayan kolon düşer, hiçbir kod yeniden
-- yazılmaz, mevcut varyantlar aynen kalır.

ALTER TABLE "Product"
    DROP COLUMN "variantCodesLockedAt",
    DROP COLUMN "variantCodesLockedByUserId";
