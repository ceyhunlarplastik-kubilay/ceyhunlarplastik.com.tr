import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type {
    ProductIndustrialUsage,
    ProductIndustrialUsageTranslation,
} from "@/prisma/generated/prisma/client"

export type ProductIndustrialUsageTranslationData = Pick<
    ProductIndustrialUsageTranslation,
    "id" | "locale" | "usageFunction" | "createdAt" | "updatedAt"
>

export type LocalizedProductIndustrialUsage<
    T extends ProductIndustrialUsage & {
        translations?: ProductIndustrialUsageTranslationData[]
    }
> = Omit<T, "usageFunction"> & {
    usageFunction: string | null
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    translations: ProductIndustrialUsageTranslationData[]
}

export function localizeProductIndustrialUsage<
    T extends ProductIndustrialUsage & {
        translations?: ProductIndustrialUsageTranslationData[]
    }
>(
    usage: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedProductIndustrialUsage<T> {
    const translations = usage.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const legacyUsageFunction = usage.usageFunction?.trim() || null
    const resolvedUsageFunction = resolvedTranslation?.usageFunction ?? legacyUsageFunction
    const sourceHasContent = Boolean(fallbackTranslation || legacyUsageFunction)
    const hasRequestedContent =
        requestedLocale === DEFAULT_LOCALE ||
        !sourceHasContent ||
        Boolean(requestedTranslation)

    return {
        ...usage,
        usageFunction: resolvedUsageFunction,
        locale: requestedLocale,
        resolvedLocale: resolvedTranslation?.locale ?? DEFAULT_LOCALE,
        translationMissing: !hasRequestedContent,
        translations: translations.map((translation) => ({
            id: translation.id,
            locale: translation.locale,
            usageFunction: translation.usageFunction,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    }
}
