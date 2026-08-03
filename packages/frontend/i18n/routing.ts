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
 */
export const routing = defineRouting({
    locales: ["tr", "en", "de", "fr", "es", "it", "pt", "pl"],
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
