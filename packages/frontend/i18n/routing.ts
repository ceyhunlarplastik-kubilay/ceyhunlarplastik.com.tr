import { defineRouting } from "next-intl/routing";

/**
 * YAYINDAKİ diller. `@core/i18n/locales` "sistem bu dili tanıyor" listesidir ve 14
 * kod içerir; burası ise gerçekten SUNULAN alt kümedir. İkisi bilinçli ayrı:
 * çevirisi tamamlanmamış bir dil admin'de girilebilirken sitede kapalı kalabilir.
 *
 * Bir dili buraya eklemeden önce:
 *  1. `messages/<locale>.json` tam olmalı
 *     (`npm run translate:messages -w @ceyhunlarweb/core -- --plan --target-locale <l>`
 *     → `missingKeys: 0`)
 *  2. `i18n/sourceLanguageLeakage.test.ts` geçmeli — bu test kapsamını buradan
 *     aldığı için ekleme yapıldığı anda o dili de kontrol etmeye başlar
 *  3. Alfabesi Latin değilse font subset'i eklenmeli (`app/fonts.ts`), Arapça için
 *     ayrıca RTL düzen denetimi gerekir
 *
 * Dalga 1 (de/fr/es/it/pt/pl) 2026-07-31'de açıldı: hepsi Latin alfabesi,
 * `latin-ext` subset'i Lehçe için eklendi.
 *
 * Dalga 2 (ru) 2026-08-03'te açıldı: ilk Latin-dışı alfabe. `cyrillic` subset'i
 * üç fonta da eklendi. Kiril'in getirdiği ek denetim: birebir sızıntı testi
 * yakalayamadığı halde Kiril metnin İÇİNDE kalmış Latin kelime aranmalı
 * («industrial usage» ve `ARGE` böyle bulundu). Aynı tarama ar/ko/ja/zh/hi
 * dalgalarında da tekrarlanmalı.
 *
 * Dalga 3 (ar) 2026-08-03'te açıldı: ilk RTL dil. İki ek maliyet getirdi ve
 * ikisi de sonraki RTL dillerinde TEKRARLANMAYACAK (bir kez ödendi):
 *  - Arapça için AYRI font ailesi (`Noto Sans Arabic`) — mevcut ailelerin
 *    hiçbiri `arabic` sunmuyordu, subset eklemek yetmedi.
 *  - Public ağaçtaki 194 fiziksel yön sınıfının mantıksala geçirilmesi
 *    (AR-1..3) ve `components/logicalProperties.test.ts` kapısı.
 * Yeni bir RTL dil (ör. fa, he, ur) açılırsa yalnız katalog + font subset'i
 * kontrolü gerekir; düzen tarafı hazır.
 */
export const routing = defineRouting({
    locales: ["tr", "en", "de", "fr", "es", "it", "pt", "pl", "ru", "ar"],
    defaultLocale: "tr",

    // TR URL'ler prefixsiz kalır (/hakkimizda), EN /en altında yaşar (/en/hakkimizda).
    // Mevcut TR URL'lerin ve SEO'nun hiç değişmemesi bu ayara bağlıdır — değiştirmeyin.
    localePrefix: "as-needed",

    // Accept-Language / cookie ile otomatik yönlendirme BİLİNÇLİ olarak kapalı:
    // açık olsaydı EN tarayıcılı ziyaretçiler (ve Google bot) / adresinden /en'e
    // redirect edilirdi — mevcut ziyaretçi davranışı ve indeksleme değişirdi.
    // Dil değişimi yalnızca kullanıcının manuel seçimiyle olur (Faz 1b'de switcher).
    localeDetection: false,
});
