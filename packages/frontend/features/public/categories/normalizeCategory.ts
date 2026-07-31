import { DEFAULT_LOCALE, getSupportedLocale } from "@core/i18n/locales"

import type { Category } from "./types"

export function normalizeCategory(
    category: Category,
    requestedLocale: string = DEFAULT_LOCALE,
): Category {
    // Eskiden `requestedLocale === "en" ? "en" : "tr"` idi: bilinmeyen her dil
    // sessizce TR'ye düşüyordu ve `translationMissing` her zaman false çıkıyordu,
    // dolayısıyla o dillerde `noindex` hiç uygulanmıyordu.
    const locale = getSupportedLocale(requestedLocale)
    const translations = Array.isArray(category.translations)
        ? category.translations
        : []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === locale,
    )
    const defaultTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const alternateSlugs: Record<string, string> = {
        [DEFAULT_LOCALE]: defaultTranslation?.slug ?? category.slug,
        ...(category.alternateSlugs ?? {}),
    }

    for (const translation of translations) {
        alternateSlugs[translation.locale] = translation.slug
    }

    return {
        ...category,
        locale: category.locale ?? locale,
        resolvedLocale: category.resolvedLocale
            ?? requestedTranslation?.locale
            ?? defaultTranslation?.locale
            ?? DEFAULT_LOCALE,
        translationMissing: category.translationMissing
            ?? (locale !== DEFAULT_LOCALE && !requestedTranslation),
        alternateSlugs,
        translations,
    }
}
