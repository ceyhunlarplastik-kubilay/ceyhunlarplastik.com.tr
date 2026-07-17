import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type { Category, CategoryTranslation } from "@/prisma/generated/prisma/client"

export type CategoryTranslationData = Pick<
    CategoryTranslation,
    "id" | "locale" | "name" | "slug" | "createdAt" | "updatedAt"
>

export type LocalizedCategory<
    T extends Category & { translations?: CategoryTranslation[] } = Category & {
        translations: CategoryTranslation[]
    }
> = Omit<T, "name" | "slug"> & {
    name: string
    slug: string
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    alternateSlugs: Record<string, string>
    translations: CategoryTranslationData[]
}

export function localizeCategory<
    T extends Category & { translations?: CategoryTranslation[] }
>(category: T, requestedLocale: SupportedLocale = DEFAULT_LOCALE): LocalizedCategory<T> {
    const translations = category.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const hasRequestedContent = requestedLocale === DEFAULT_LOCALE || Boolean(requestedTranslation)

    const alternateSlugs: Record<string, string> = {
        [DEFAULT_LOCALE]: fallbackTranslation?.slug ?? category.slug,
    }

    for (const translation of translations) {
        alternateSlugs[translation.locale] = translation.slug
    }

    return {
        ...category,
        name: resolvedTranslation?.name ?? category.name,
        slug: resolvedTranslation?.slug ?? category.slug,
        locale: requestedLocale,
        resolvedLocale: resolvedTranslation?.locale ?? DEFAULT_LOCALE,
        translationMissing: !hasRequestedContent,
        alternateSlugs,
        translations: translations.map((translation) => ({
            id: translation.id,
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    }
}
