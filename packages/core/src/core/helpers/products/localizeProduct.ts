import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type { Product, ProductTranslation } from "@/prisma/generated/prisma/client"

export type ProductTranslationData = Pick<
    ProductTranslation,
    "id" | "locale" | "name" | "slug" | "description" | "createdAt" | "updatedAt"
>

export type LocalizedProduct<
    T extends Product & { translations?: ProductTranslationData[] }
> = Omit<T, "name" | "slug" | "description"> & {
    name: string
    slug: string
    description: string | null
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    alternateSlugs: Record<string, string>
    translations: ProductTranslationData[]
}

export function localizeProduct<
    T extends Product & { translations?: ProductTranslationData[] }
>(
    product: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedProduct<T> {
    const translations = product.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const hasRequestedContent = requestedLocale === DEFAULT_LOCALE || Boolean(requestedTranslation)

    const alternateSlugs: Record<string, string> = {
        [DEFAULT_LOCALE]: fallbackTranslation?.slug ?? product.slug,
    }

    for (const translation of translations) {
        alternateSlugs[translation.locale] = translation.slug
    }

    const description = resolvedTranslation
        ? resolvedTranslation.description ?? (
            resolvedTranslation.locale === DEFAULT_LOCALE
                ? product.description ?? null
                : null
        )
        : product.description ?? null

    return {
        ...product,
        name: resolvedTranslation?.name ?? product.name,
        slug: resolvedTranslation?.slug ?? product.slug,
        description,
        locale: requestedLocale,
        resolvedLocale: resolvedTranslation?.locale ?? DEFAULT_LOCALE,
        translationMissing: !hasRequestedContent,
        alternateSlugs,
        translations: translations.map((translation) => ({
            id: translation.id,
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    }
}
