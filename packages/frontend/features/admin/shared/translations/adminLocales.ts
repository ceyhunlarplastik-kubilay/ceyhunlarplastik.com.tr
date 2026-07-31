import { DEFAULT_LOCALE, SUPPORTED_LOCALES, TARGET_LOCALES, type SupportedLocale } from "@core/i18n/locales"
import { LOCALE_METADATA } from "@/i18n/localeMetadata"

/**
 * Admin panelinin çeviri yüzeyi — dil listesi tek kaynaktan (`@core/i18n/locales`).
 *
 * Yeni dil eklemek yalnızca core listesine bir kod eklemektir; buradaki
 * bileşenlerin, formların ve `translations.<index>` yollarının hiçbiri
 * değişmez.
 *
 * Panelin YAYIN durumuyla ilgisi yoktur: bir dil `routing.locales` içinde
 * olmasa da admin'de içeriği girilebilir. Bu bilinçlidir — çeviri önce
 * girilir, dil sonra açılır.
 */
export const ADMIN_LOCALES = SUPPORTED_LOCALES
export const ADMIN_DEFAULT_LOCALE = DEFAULT_LOCALE
export const ADMIN_TARGET_LOCALES = TARGET_LOCALES

export type AdminLocale = SupportedLocale

/**
 * Etiketler TÜRKÇE — public `LOCALE_METADATA` endonym kullanır ("한국어"), ama
 * admin paneli bilinçli olarak TR-only ve veri girişi yapan kişi "Korece"
 * ifadesini arıyor. Bayraklar public tarafla ortak kalır.
 */
export const ADMIN_LOCALE_LABELS: Record<AdminLocale, string> = {
    tr: "Türkçe",
    en: "İngilizce",
    de: "Almanca",
    fr: "Fransızca",
    es: "İspanyolca",
    it: "İtalyanca",
    pt: "Portekizce",
    pl: "Lehçe",
    ru: "Rusça",
    ar: "Arapça",
    ko: "Korece",
    ja: "Japonca",
    zh: "Çince",
    hi: "Hintçe",
}

export function adminLocaleLabel(locale: string): string {
    return ADMIN_LOCALE_LABELS[locale as AdminLocale] ?? locale
}

export function adminLocaleFlag(locale: string): string {
    return LOCALE_METADATA[locale as AdminLocale]?.flag ?? "🏳️"
}

/**
 * Hedef bir dilin `translations` dizisindeki SABİT indeksi.
 *
 * Formlar RHF yollarını (`translations.<index>.name`) bu indeksten kurar,
 * dolayısıyla `TARGET_LOCALES` sırası değişmemeli — core'daki liste de bunu
 * söylüyor. Varsayılan dil için -1 döner: onun alanı dizide değil, kaydın
 * kendi kolonundadır.
 */
export function adminTranslationIndex(locale: AdminLocale): number {
    return (ADMIN_TARGET_LOCALES as readonly string[]).indexOf(locale)
}

export function isAdminLocale(value: string): value is AdminLocale {
    return (ADMIN_LOCALES as readonly string[]).includes(value)
}
