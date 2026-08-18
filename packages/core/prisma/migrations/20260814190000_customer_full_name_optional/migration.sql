-- Yetkili kişi adı opsiyonel hale geliyor: veri girişi panelinde kaydedilen kayıt
-- bir FİRMADIR, yetkili adı sonradan öğrenilebilir. Public web formunda ise alan
-- zorunlu kalır — kısıt yüzeye özel validator'larda, şemada değil.
--
-- Yalnız NOT NULL kaldırılıyor; mevcut satırlar aynen kalır, geri doldurma YOK.

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "fullName" DROP NOT NULL;
