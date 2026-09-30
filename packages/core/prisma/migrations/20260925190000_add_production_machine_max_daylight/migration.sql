-- Üretim planlama Dilim 1.6: hidrolik kapamalı makinelerde kullanılabilir açılma
-- = min(strok, plaka açıklığı − kalıp kalınlığı). Yalnız ekleme; boş bırakılabilir, backfill yok.

-- AlterTable
ALTER TABLE "ProductionMachine" ADD COLUMN     "maxDaylightMm" INTEGER;
