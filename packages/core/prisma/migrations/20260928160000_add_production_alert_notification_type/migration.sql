-- Üretim Planlama — Dilim 4.5: kalıcı üretim bildirimleri (zil).
-- Yalnız EKLEME: bildirim türüne tek değer. Uyarının alt türü (gecikme, termin riski, kalıp bakımı)
-- `UserNotification.data.kind`'da, tekrar önleme anahtarı `data.alertKey`'de tutulur — yeni bir uyarı
-- türü migration istemez. Mevcut satırlara dokunulmaz.

-- AlterEnum
ALTER TYPE "UserNotificationType" ADD VALUE 'PRODUCTION_ALERT';
