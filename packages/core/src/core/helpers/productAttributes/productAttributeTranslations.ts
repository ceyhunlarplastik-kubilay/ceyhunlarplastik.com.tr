import slugify from "slugify"

import {
    DEFAULT_LOCALE,
    isSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"

export type ProductAttributeTranslationInput = {
    locale: SupportedLocale
    name: string
}

export type ProductAttributeValueTranslationInput = {
    locale: SupportedLocale
    name: string
    slug?: string
}

export class ProductAttributeTranslationInputError extends Error {}

function normalizeByLocale<T extends { locale: SupportedLocale; name: string }>(
    translations: T[],
) {
    const byLocale = new Map<SupportedLocale, T>()

    for (const translation of translations) {
        if (!isSupportedLocale(translation.locale)) {
            throw new ProductAttributeTranslationInputError(
                `Unsupported locale: ${translation.locale}`,
            )
        }
        if (byLocale.has(translation.locale)) {
            throw new ProductAttributeTranslationInputError(
                `Duplicate locale: ${translation.locale}`,
            )
        }

        byLocale.set(translation.locale, translation)
    }

    return byLocale
}

function buildSlug(value: string, locale: SupportedLocale) {
    return slugify(value, {
        lower: true,
        strict: true,
        locale,
    })
}

function assertName(name: string, locale: SupportedLocale) {
    if (name.length < 2) {
        throw new ProductAttributeTranslationInputError(
            `${locale} translation name must be at least 2 characters`,
        )
    }
}

export function normalizeProductAttributeTranslations({
    legacyName,
    translations = [],
    requireTurkish = false,
}: {
    legacyName?: string
    translations?: ProductAttributeTranslationInput[]
    requireTurkish?: boolean
}) {
    const byLocale = normalizeByLocale(translations)
    const explicitTurkish = byLocale.get(DEFAULT_LOCALE)

    if (legacyName && explicitTurkish && explicitTurkish.name !== legacyName) {
        throw new ProductAttributeTranslationInputError(
            "name and the TR translation name must match",
        )
    }

    if (legacyName) {
        byLocale.set(DEFAULT_LOCALE, {
            locale: DEFAULT_LOCALE,
            name: legacyName,
        })
    }

    if (requireTurkish && !byLocale.has(DEFAULT_LOCALE)) {
        throw new ProductAttributeTranslationInputError("A TR translation is required")
    }

    const normalized = Array.from(byLocale.values()).map((translation) => {
        const name = translation.name.trim()
        assertName(name, translation.locale)

        return {
            locale: translation.locale,
            name,
        }
    })

    return {
        translations: normalized,
        turkish: normalized.find((translation) => translation.locale === DEFAULT_LOCALE),
    }
}

export function normalizeProductAttributeValueTranslations({
    legacyName,
    translations = [],
    requireTurkish = false,
}: {
    legacyName?: string
    translations?: ProductAttributeValueTranslationInput[]
    requireTurkish?: boolean
}) {
    const byLocale = normalizeByLocale(translations)
    const explicitTurkish = byLocale.get(DEFAULT_LOCALE)

    if (legacyName && explicitTurkish && explicitTurkish.name !== legacyName) {
        throw new ProductAttributeTranslationInputError(
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
        throw new ProductAttributeTranslationInputError("A TR translation is required")
    }

    const normalized = Array.from(byLocale.values()).map((translation) => {
        const name = translation.name.trim()
        const slugSource = translation.slug?.trim() || name
        const slug = buildSlug(slugSource, translation.locale)

        assertName(name, translation.locale)
        if (!slug) {
            throw new ProductAttributeTranslationInputError(
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
