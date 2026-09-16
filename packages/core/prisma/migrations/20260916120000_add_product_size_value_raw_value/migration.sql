-- "10*30" gibi bileşik ölçü girişleri için: kullanıcının birebir girdiği metin
-- burada saklanır, `value` sıralama sürrogatı olarak (ilk sayı) kullanılmaya
-- devam eder. Düz sayısal girişte NULL kalır — mevcut satırlar etkilenmez.

-- AlterTable
ALTER TABLE "ProductSizeValue" ADD COLUMN     "rawValue" TEXT;
