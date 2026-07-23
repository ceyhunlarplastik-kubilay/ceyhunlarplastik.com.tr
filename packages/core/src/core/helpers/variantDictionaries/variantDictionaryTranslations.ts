import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/core/i18n/locales"

export class VariantDictionaryTranslationInputError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "VariantDictionaryTranslationInputError"
    }
}

export type VariantDictionaryTranslationInput = {
    locale: string
    name: string
}

export type NormalizedVariantDictionaryTranslation = {
    locale: SupportedLocale
    name: string
}

export function normalizeVariantDictionaryTranslations({
    legacyName,
    translations,
    requireTurkish = false,
}: {
    legacyName?: string
    translations?: VariantDictionaryTranslationInput[]
    requireTurkish?: boolean
}) {
    const byLocale = new Map<SupportedLocale, NormalizedVariantDictionaryTranslation>()
    const hasLegacyName = legacyName !== undefined

    if (hasLegacyName) {
        byLocale.set(DEFAULT_LOCALE, {
            locale: DEFAULT_LOCALE,
            name: legacyName,
        })
    }

    for (const translation of translations ?? []) {
        if (!isSupportedLocale(translation.locale)) {
            throw new VariantDictionaryTranslationInputError(
                `Unsupported translation locale: ${translation.locale}`,
            )
        }

        if (translation.locale === DEFAULT_LOCALE && hasLegacyName) {
            continue
        }

        const existing = byLocale.get(translation.locale)
        if (existing && existing.name !== translation.name && translation.locale !== DEFAULT_LOCALE) {
            throw new VariantDictionaryTranslationInputError(
                `Duplicate translation locale: ${translation.locale}`,
            )
        }

        if (!existing || translation.locale === DEFAULT_LOCALE) {
            byLocale.set(translation.locale, {
                locale: translation.locale,
                name: translation.name,
            })
        }
    }

    const turkish = byLocale.get(DEFAULT_LOCALE)
    if (requireTurkish && !turkish) {
        throw new VariantDictionaryTranslationInputError("Turkish translation is required")
    }

    return {
        turkish,
        translations: [...byLocale.values()],
        createOnlyTranslations: [...byLocale.values()].filter(
            (translation) => translation.locale !== DEFAULT_LOCALE,
        ),
    }
}
