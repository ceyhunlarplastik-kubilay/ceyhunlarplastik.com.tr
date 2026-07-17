import type { Category } from "./types"

export function normalizeCategory(
    category: Category,
    requestedLocale: string = "tr",
): Category {
    const locale: Category["locale"] = requestedLocale === "en" ? "en" : "tr"
    const translations = Array.isArray(category.translations)
        ? category.translations
        : []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === locale,
    )
    const turkishTranslation = translations.find(
        (translation) => translation.locale === "tr",
    )
    const alternateSlugs: Record<string, string> = {
        tr: turkishTranslation?.slug ?? category.slug,
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
            ?? turkishTranslation?.locale
            ?? "tr",
        translationMissing: category.translationMissing
            ?? (locale !== "tr" && !requestedTranslation),
        alternateSlugs,
        translations,
    }
}
