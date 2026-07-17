import slugify from "slugify"

import {
    DEFAULT_LOCALE,
    isSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"

export type CategoryTranslationInput = {
    locale: SupportedLocale
    name: string
    slug?: string
}

export class CategoryTranslationInputError extends Error {}

function buildSlug(value: string, locale: SupportedLocale) {
    return slugify(value, {
        lower: true,
        strict: true,
        locale,
    })
}

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

    const normalized = Array.from(byLocale.values()).map((translation) => {
        const name = translation.name.trim()
        const slugSource = translation.slug?.trim() || name
        const slug = buildSlug(slugSource, translation.locale)

        if (name.length < 2) {
            throw new CategoryTranslationInputError(
                `${translation.locale} translation name must be at least 2 characters`,
            )
        }
        if (!slug) {
            throw new CategoryTranslationInputError(
                `${translation.locale} translation slug could not be generated`,
            )
        }

        return {
            locale: translation.locale,
            name,
            slug,
        }
    })

    return {
        translations: normalized,
        turkish: normalized.find((translation) => translation.locale === DEFAULT_LOCALE),
    }
}
