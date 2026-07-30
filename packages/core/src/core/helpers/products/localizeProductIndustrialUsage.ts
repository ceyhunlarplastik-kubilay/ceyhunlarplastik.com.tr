import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type {
    ProductIndustrialUsage,
    ProductIndustrialUsageTranslation,
} from "@/prisma/generated/prisma/client"

export type ProductIndustrialUsageTranslationData = Pick<
    ProductIndustrialUsageTranslation,
    "id" | "locale" | "usageFunction" | "imageKey" | "createdAt" | "updatedAt"
>

export type LocalizedProductIndustrialUsage<
    T extends ProductIndustrialUsage & {
        translations?: ProductIndustrialUsageTranslationData[]
    }
> = Omit<T, "usageFunction" | "imageKey"> & {
    usageFunction: string | null
    /** İstenen locale'in görseli; yoksa ProductIndustrialUsage.imageKey (varsayılan/TR). */
    imageKey: string | null
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
    // usageFunction nullable olduğu için "çeviri satırı var" ARTIK "metin
    // çevrilmiş" demek değil: yalnız görseli çevrilen satırlar da var. Bu yüzden
    // metin çözümlemesi satırın varlığına değil, metnin kendisine bakar.
    const requestedUsageFunction = requestedTranslation?.usageFunction?.trim() || null
    const fallbackUsageFunction = fallbackTranslation?.usageFunction?.trim() || null
    const legacyUsageFunction = usage.usageFunction?.trim() || null

    const resolvedUsageFunction =
        requestedUsageFunction ?? fallbackUsageFunction ?? legacyUsageFunction
    const sourceHasContent = Boolean(fallbackUsageFunction || legacyUsageFunction)
    const hasRequestedContent =
        requestedLocale === DEFAULT_LOCALE ||
        !sourceHasContent ||
        Boolean(requestedUsageFunction)

    // Görsel metinden bağımsız çözümlenir: EN görseli olup EN metni olmayan
    // (ya da tersi) satırlar geçerlidir. TR çeviri satırında imageKey hiçbir
    // zaman yazılmaz — TR görseli base kolonda durur, bkz. productIndustrialUsages.ts
    const resolvedImageKey =
        requestedTranslation?.imageKey?.trim() || usage.imageKey?.trim() || null

    return {
        ...usage,
        usageFunction: resolvedUsageFunction,
        imageKey: resolvedImageKey,
        locale: requestedLocale,
        resolvedLocale: requestedUsageFunction ? requestedLocale : DEFAULT_LOCALE,
        translationMissing: !hasRequestedContent,
        translations: translations.map((translation) => ({
            id: translation.id,
            locale: translation.locale,
            usageFunction: translation.usageFunction,
            imageKey: translation.imageKey,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    }
}
