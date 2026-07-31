import { SUPPORTED_LOCALES, type SupportedLocale } from "@core/i18n/locales";

/**
 * Dillerin sunum bilgisi — etiket, bayrak, yazı yönü, og:locale.
 *
 * `@core/i18n/locales` "sistem bu dili tanıyor" listesidir; buradaki kayıt onun
 * arayüz karşılığıdır. Bir dilin public sitede YAYINLANMASI ayrıca
 * `routing.locales` içinde olmasına bağlıdır — ikisi bilinçli ayrıdır, böylece
 * çevirisi tamamlanmamış bir dil admin'de girilebilirken sitede kapalı kalır.
 *
 * Etiketler bilinçli olarak ANA DİLDE (endonym): dil seçicide kullanıcı kendi
 * dilini tanıyabilmeli.
 */
export type LocaleMetadata = {
    /** Dilin kendi dilindeki adı. */
    label: string;
    flag: string;
    dir: "ltr" | "rtl";
    /** Open Graph `og:locale` formatı (language_TERRITORY). */
    ogLocale: string;
};

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
    tr: { label: "Türkçe", flag: "🇹🇷", dir: "ltr", ogLocale: "tr_TR" },
    en: { label: "English", flag: "🇬🇧", dir: "ltr", ogLocale: "en_US" },
    de: { label: "Deutsch", flag: "🇩🇪", dir: "ltr", ogLocale: "de_DE" },
    fr: { label: "Français", flag: "🇫🇷", dir: "ltr", ogLocale: "fr_FR" },
    es: { label: "Español", flag: "🇪🇸", dir: "ltr", ogLocale: "es_ES" },
    it: { label: "Italiano", flag: "🇮🇹", dir: "ltr", ogLocale: "it_IT" },
    // DeepL hedefi pt-BR seçildi; içerik Brezilya Portekizcesi olacağı için bayrak da öyle.
    pt: { label: "Português", flag: "🇧🇷", dir: "ltr", ogLocale: "pt_BR" },
    pl: { label: "Polski", flag: "🇵🇱", dir: "ltr", ogLocale: "pl_PL" },
    ru: { label: "Русский", flag: "🇷🇺", dir: "ltr", ogLocale: "ru_RU" },
    // Arapça tek bir ülkeye ait değil; bayrak temsilî.
    ar: { label: "العربية", flag: "🇸🇦", dir: "rtl", ogLocale: "ar_AR" },
    ko: { label: "한국어", flag: "🇰🇷", dir: "ltr", ogLocale: "ko_KR" },
    ja: { label: "日本語", flag: "🇯🇵", dir: "ltr", ogLocale: "ja_JP" },
    // DeepL hedefi zh-HANS (basitleştirilmiş).
    zh: { label: "简体中文", flag: "🇨🇳", dir: "ltr", ogLocale: "zh_CN" },
    hi: { label: "हिन्दी", flag: "🇮🇳", dir: "ltr", ogLocale: "hi_IN" },
};

export function getLocaleMetadata(locale: string): LocaleMetadata {
    return (
        LOCALE_METADATA[locale as SupportedLocale] ??
        LOCALE_METADATA[SUPPORTED_LOCALES[0]]
    );
}

export function getLocaleDirection(locale: string): "ltr" | "rtl" {
    return getLocaleMetadata(locale).dir;
}

export function getOgLocale(locale: string): string {
    return getLocaleMetadata(locale).ogLocale;
}
