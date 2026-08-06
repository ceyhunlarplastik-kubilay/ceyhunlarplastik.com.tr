
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

function assertName(name: string, locale: SupportedLocale) {
    if (isTranslationNameTooShort(name)) {
        throw new ProductAttributeTranslationInputError(
            `${locale} translation name must be at least ${TRANSLATION_NAME_MIN_LENGTH} character(s)`,
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

    // İki geçiş: ASCII dışı yazı sistemlerinde slugify boş döner (ko/ja/zh/hi),
    // bu durumda varsayılan dilin slug'ına düşülür — bkz. translationSlug.ts.
    const attempted = Array.from(byLocale.values()).map((translation) => {
        const name = translation.name.trim()
        assertName(name, translation.locale)

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
            throw new ProductAttributeTranslationInputError(
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
