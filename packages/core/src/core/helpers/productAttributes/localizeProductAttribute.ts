import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type {
    ProductAttribute,
    ProductAttributeTranslation,
    ProductAttributeValue,
    ProductAttributeValueTranslation,
} from "@/prisma/generated/prisma/client"

export type ProductAttributeTranslationData = Pick<
    ProductAttributeTranslation,
    "id" | "locale" | "name" | "createdAt" | "updatedAt"
>

export type ProductAttributeValueTranslationData = Pick<
    ProductAttributeValueTranslation,
    "id" | "locale" | "name" | "slug" | "createdAt" | "updatedAt"
>

export type LocalizedProductAttribute<
    T extends ProductAttribute & { translations?: ProductAttributeTranslationData[] }
> = Omit<T, "name"> & {
    name: string
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    translations: ProductAttributeTranslationData[]
}

export type LocalizedProductAttributeValue<
    T extends ProductAttributeValue & { translations?: ProductAttributeValueTranslationData[] }
> = Omit<T, "name" | "slug"> & {
    name: string
    slug: string
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    alternateSlugs: Record<string, string>
    translations: ProductAttributeValueTranslationData[]
}

export function localizeProductAttribute<
    T extends ProductAttribute & { translations?: ProductAttributeTranslationData[] }
>(
    attribute: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedProductAttribute<T> {
    const translations = attribute.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const hasRequestedContent = requestedLocale === DEFAULT_LOCALE || Boolean(requestedTranslation)

    return {
        ...attribute,
        name: resolvedTranslation?.name ?? attribute.name,
        locale: requestedLocale,
        resolvedLocale: resolvedTranslation?.locale ?? DEFAULT_LOCALE,
        translationMissing: !hasRequestedContent,
        translations: translations.map((translation) => ({
            id: translation.id,
            locale: translation.locale,
            name: translation.name,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    }
}

export function localizeProductAttributeValue<
    T extends ProductAttributeValue & { translations?: ProductAttributeValueTranslationData[] }
>(
    value: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedProductAttributeValue<T> {
    const translations = value.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const hasRequestedContent = requestedLocale === DEFAULT_LOCALE || Boolean(requestedTranslation)
    const alternateSlugs: Record<string, string> = {
        [DEFAULT_LOCALE]: fallbackTranslation?.slug ?? value.slug,
    }

    for (const translation of translations) {
        alternateSlugs[translation.locale] = translation.slug
    }

    return {
        ...value,
        name: resolvedTranslation?.name ?? value.name,
        slug: resolvedTranslation?.slug ?? value.slug,
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
