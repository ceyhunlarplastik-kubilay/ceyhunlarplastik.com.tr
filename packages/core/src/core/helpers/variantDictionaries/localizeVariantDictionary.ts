import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

import type {
    Color,
    ColorTranslation,
    Material,
    MaterialTranslation,
    MeasurementType,
    MeasurementTypeTranslation,
} from "@/prisma/generated/prisma/client"

type DictionaryTranslationData = {
    id: string
    locale: string
    name: string
    createdAt: Date
    updatedAt: Date
}

export type MeasurementTypeTranslationData = Pick<
    MeasurementTypeTranslation,
    "id" | "locale" | "name" | "createdAt" | "updatedAt"
>

export type MaterialTranslationData = Pick<
    MaterialTranslation,
    "id" | "locale" | "name" | "createdAt" | "updatedAt"
>

export type ColorTranslationData = Pick<
    ColorTranslation,
    "id" | "locale" | "name" | "createdAt" | "updatedAt"
>

type LocalizedNamedDictionaryEntity<
    T extends { name: string; translations?: DictionaryTranslationData[] }
> = Omit<T, "name"> & {
    name: string
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    translations: DictionaryTranslationData[]
}

export type LocalizedMeasurementType<
    T extends MeasurementType & { translations?: MeasurementTypeTranslationData[] }
> = LocalizedNamedDictionaryEntity<T>

export type LocalizedMaterial<
    T extends Material & { translations?: MaterialTranslationData[] }
> = LocalizedNamedDictionaryEntity<T>

export type LocalizedColor<
    T extends Color & { translations?: ColorTranslationData[] }
> = LocalizedNamedDictionaryEntity<T>

function localizeNamedDictionaryEntity<
    T extends { name: string; translations?: DictionaryTranslationData[] }
>(
    entity: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedNamedDictionaryEntity<T> {
    const translations = entity.translations ?? []
    const requestedTranslation = translations.find(
        (translation) => translation.locale === requestedLocale,
    )
    const fallbackTranslation = translations.find(
        (translation) => translation.locale === DEFAULT_LOCALE,
    )
    const resolvedTranslation = requestedTranslation ?? fallbackTranslation
    const hasRequestedContent = requestedLocale === DEFAULT_LOCALE || Boolean(requestedTranslation)

    return {
        ...entity,
        name: resolvedTranslation?.name ?? entity.name,
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

export function localizeMeasurementType<
    T extends MeasurementType & { translations?: MeasurementTypeTranslationData[] }
>(
    measurementType: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedMeasurementType<T> {
    return localizeNamedDictionaryEntity(measurementType, requestedLocale)
}

export function localizeMaterial<
    T extends Material & { translations?: MaterialTranslationData[] }
>(
    material: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedMaterial<T> {
    return localizeNamedDictionaryEntity(material, requestedLocale)
}

export function localizeColor<
    T extends Color & { translations?: ColorTranslationData[] }
>(
    color: T,
    requestedLocale: SupportedLocale = DEFAULT_LOCALE,
): LocalizedColor<T> {
    return localizeNamedDictionaryEntity(color, requestedLocale)
}

export function withoutDictionaryTranslations<T extends { translations?: unknown[] }>(
    entity: T,
): Omit<T, "translations"> {
    const { translations: _translations, ...rest } = entity
    return rest
}
