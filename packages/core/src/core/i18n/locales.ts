export const SUPPORTED_LOCALES = ["tr", "en"] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "tr"

export function isSupportedLocale(value: unknown): value is SupportedLocale {
    return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function getSupportedLocale(value: unknown): SupportedLocale {
    return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}
