import {
    DEFAULT_LOCALE,
    isSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"
import {
    buildTranslationSlug,
    isTranslationNameTooShort,
    TRANSLATION_NAME_MIN_LENGTH,
} from "@/core/i18n/translationSlug"

export type CategoryTranslationInput = {
    locale: SupportedLocale
    name: string
    slug?: string
}

export class CategoryTranslationInputError extends Error {}

export function normalizeCategoryTranslations({
    legacyName,
    translations = [],
    requireTurkish = false,
}: {
    legacyName?: string
    translations?: CategoryTranslationInput[]
    requireTurkish?: boolean
}) {
    const byLocale = new Map<SupportedLocale, CategoryTranslationInput>()

    for (const translation of translations) {
        if (!isSupportedLocale(translation.locale)) {
            throw new CategoryTranslationInputError(`Unsupported locale: ${translation.locale}`)
        }
        if (byLocale.has(translation.locale)) {
            throw new CategoryTranslationInputError(`Duplicate locale: ${translation.locale}`)
        }

        byLocale.set(translation.locale, translation)
    }

    const explicitTurkish = byLocale.get(DEFAULT_LOCALE)
    if (legacyName && explicitTurkish && explicitTurkish.name !== legacyName) {
        throw new CategoryTranslationInputError(
            "name and the TR translation name must match",
        )
    }

    if (legacyName) {
        byLocale.set(DEFAULT_LOCALE, {
            locale: DEFAULT_LOCALE,
            name: legacyName,
            slug: explicitTurkish?.slug,
        })
    }

    if (requireTurkish && !byLocale.has(DEFAULT_LOCALE)) {
        throw new CategoryTranslationInputError("A TR translation is required")
    }

    // İki geçiş: ASCII dışı yazı sistemlerinde slugify boş döndüğü için
    // (ko/ja/zh/hi) varsayılan dilin slug'ına düşülür — bkz. translationSlug.ts.
    // Fallback'i kullanabilmek için önce tüm slug'lar denenir.
    const attempted = Array.from(byLocale.values()).map((translation) => {
        const name = translation.name.trim()

        if (isTranslationNameTooShort(name)) {
            throw new CategoryTranslationInputError(
                `${translation.locale} translation name must be at least ${TRANSLATION_NAME_MIN_LENGTH} character(s)`,
            )
        }

        return {
            locale: translation.locale,
            name,
            slug: translation.slug?.trim()
                ? buildTranslationSlug(translation.slug.trim(), translation.locale)
                : buildTranslationSlug(name, translation.locale, { derivedFromName: true }),
        }
    })

    const defaultLocaleSlug = attempted.find(
        (entry) => entry.locale === DEFAULT_LOCALE,
    )?.slug

    const normalized = attempted.map((entry) => {
        const slug = entry.slug || defaultLocaleSlug

        if (!slug) {
            throw new CategoryTranslationInputError(
                `${entry.locale} translation slug could not be generated`,
            )
        }

        return {
            locale: entry.locale,
            name: entry.name,
            slug,
        }
    })

    return {
        translations: normalized,
        turkish: normalized.find((translation) => translation.locale === DEFAULT_LOCALE),
    }
}
