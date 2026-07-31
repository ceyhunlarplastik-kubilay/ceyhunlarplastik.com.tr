/**
 * Uygulamanın çeviri yüzeyi için TEK kaynak.
 *
 * Sıra anlamlıdır: `DEFAULT_LOCALE` başta, geri kalanı hedef diller. Admin
 * formları `translations.<index>` yollarını bu sıradan türetiyor, dolayısıyla
 * mevcut bir kodun sırası DEĞİŞTİRİLMEMELİ — yeni diller sona eklenir.
 *
 * Buradaki liste yalnızca "sistem bu dili tanıyor" demektir; bir dilin public
 * sitede yayınlanması ayrıca `packages/frontend/i18n/routing.ts` içindeki
 * `locales` dizisine eklenmesine bağlıdır. İkisi bilinçli olarak ayrıdır:
 * çevirisi tamamlanmamış bir dil admin'de girilebilirken sitede kapalı kalabilir.
 *
 * Yeni dil eklerken ayrıca güncellenmesi gerekenler:
 *  - `core/i18n/deeplTranslator.ts` — iki dil kodu haritası (tsc zorlar)
 *  - `frontend/features/admin/shared/...` — etiket/bayrak haritası
 */
export const SUPPORTED_LOCALES = [
    "tr",
    "en",
    "de",
    "fr",
    "es",
    "it",
    "pt",
    "pl",
    "ru",
    "ar",
    "ko",
    "ja",
    "zh",
    "hi",
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE = "tr" as const satisfies SupportedLocale

/**
 * Çeviri HEDEFİ olabilen diller. Varsayılan dil hedef değildir: kaydın kendi
 * kolonlarında yaşar, ayrı bir çeviri satırı olarak silinemez.
 *
 * Tipi ayrı tutmak, "bu locale kaldırılabilir mi?" sorusunu derleme zamanına
 * taşır — `removeTranslationLocales` gibi alanlar artık `"tr"` kabul edemez.
 */
export type TargetLocale = Exclude<SupportedLocale, typeof DEFAULT_LOCALE>

export const TARGET_LOCALES: TargetLocale[] = SUPPORTED_LOCALES.filter(
    (locale): locale is TargetLocale => locale !== DEFAULT_LOCALE,
)

export function isSupportedLocale(value: unknown): value is SupportedLocale {
    return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function getSupportedLocale(value: unknown): SupportedLocale {
    return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}
