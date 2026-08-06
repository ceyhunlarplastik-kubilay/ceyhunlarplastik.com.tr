
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

export type ProductTranslationInput = {
    locale: string
    name?: string | null
    slug?: string | null
    description?: string | null
}

export type NormalizedProductTranslation = {
    locale: SupportedLocale
    name: string
    slug: string
    description: string | null
}

export class ProductTranslationInputError extends Error {}

function normalizeDescription(value: string | null | undefined) {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

export function normalizeProductTranslations({
    legacyName,
    legacySlug,
    legacyDescription,
    translations = [],
    requireTurkish = false,
}: {
    legacyName?: string | null
    legacySlug?: string | null
    legacyDescription?: string | null
    translations?: ProductTranslationInput[] | null
    requireTurkish?: boolean
}) {
    const byLocale = new Map<SupportedLocale, ProductTranslationInput & { locale: SupportedLocale }>()

    for (const translation of translations ?? []) {
        if (!isSupportedLocale(translation.locale)) {
            throw new ProductTranslationInputError(`Unsupported locale: ${translation.locale}`)
        }
        if (byLocale.has(translation.locale)) {
            throw new ProductTranslationInputError(`Duplicate locale: ${translation.locale}`)
        }

        byLocale.set(translation.locale, {
            ...translation,
            locale: translation.locale,
        })
    }

    const explicitTurkish = byLocale.get(DEFAULT_LOCALE)
    const normalizedLegacyName = legacyName?.trim()
    if (normalizedLegacyName && explicitTurkish?.name?.trim() && explicitTurkish.name.trim() !== normalizedLegacyName) {
        throw new ProductTranslationInputError("name and the TR translation name must match")
    }

    if (normalizedLegacyName) {
        byLocale.set(DEFAULT_LOCALE, {
            locale: DEFAULT_LOCALE,
            name: normalizedLegacyName,
            slug: legacySlug?.trim() || explicitTurkish?.slug,
            description: normalizeDescription(legacyDescription),
        })
    }

    if (requireTurkish && !byLocale.has(DEFAULT_LOCALE)) {
        throw new ProductTranslationInputError("A TR product translation is required")
    }

    const normalized: NormalizedProductTranslation[] = []

    for (const translation of byLocale.values()) {
        const name = translation.name?.trim()

        if (!name) {
            if (translation.locale === DEFAULT_LOCALE || translation.slug?.trim() || translation.description?.trim()) {
                throw new ProductTranslationInputError(
                    `${translation.locale} translation name is required`,
                )
            }
            continue
        }

        if (isTranslationNameTooShort(name)) {
            throw new ProductTranslationInputError(
                `${translation.locale} translation name must be at least ${TRANSLATION_NAME_MIN_LENGTH} character(s)`,
            )
        }

        // Slug ASCII dışı yazı sistemlerinde boş çıkabilir (ko/ja/zh/hi);
        // ikinci geçişte varsayılan dilin slug'ına düşülür.
        const explicitSlug = translation.slug?.trim()
        const slug = explicitSlug
            ? buildTranslationSlug(explicitSlug, translation.locale)
            : buildTranslationSlug(name, translation.locale, { derivedFromName: true })

        normalized.push({
            locale: translation.locale,
            name,
            slug,
            description: normalizeDescription(translation.description),
        })
    }

    // İkinci geçiş: slug üretilemeyen diller varsayılan dilin slug'ına düşer.
    // `@@unique([locale, slug])` locale başına olduğu için aynı slug'ın başka bir
    // dilin satırında tekrarı çakışma yaratmaz.
    const defaultLocaleSlug = normalized.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )?.slug

    for (const translation of normalized) {
        if (translation.slug) continue

        if (!defaultLocaleSlug) {
            throw new ProductTranslationInputError(
                `${translation.locale} translation slug could not be generated`,
            )
        }

        translation.slug = defaultLocaleSlug
    }

    const sorted = normalized.sort((left, right) => {
        if (left.locale === DEFAULT_LOCALE) return -1
        if (right.locale === DEFAULT_LOCALE) return 1
        return left.locale.localeCompare(right.locale)
    })

    return {
        translations: sorted,
        turkish: sorted.find((translation) => translation.locale === DEFAULT_LOCALE),
        createOnlyTranslations: sorted.filter((translation) => translation.locale !== DEFAULT_LOCALE),
    }
}

export function buildProductTranslationCreateInputs(rows: NormalizedProductTranslation[]) {
    return rows.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        description: translation.description,
    }))
}

export function buildProductTranslationUpserts(productId: string, rows: NormalizedProductTranslation[]) {
    return rows.map((translation) => ({
        where: {
            productId_locale: {
                productId,
                locale: translation.locale,
            },
        },
        create: {
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
        },
        update: {
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
        },
    }))
}
