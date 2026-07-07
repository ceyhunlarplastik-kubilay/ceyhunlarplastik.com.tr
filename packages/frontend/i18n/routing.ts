import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["tr", "en"],
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
