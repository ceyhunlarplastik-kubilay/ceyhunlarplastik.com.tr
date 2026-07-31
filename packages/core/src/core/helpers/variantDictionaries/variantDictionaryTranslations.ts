import {
    DEFAULT_LOCALE,
    isSupportedLocale,
    type SupportedLocale,
    type TargetLocale,
} from "@/core/i18n/locales"

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

/**
 * Aynı dil hem güncellenip hem silinemez.
 *
 * İkisi de gönderilirse Prisma'da sıra belirsizdir (upsert ve deleteMany aynı
 * nested write içinde) — sonuç veritabanı sürümüne bağlı hâle gelir. Sessiz
 * belirsizlik yerine açık 400 döndürmek için istek reddedilir.
 */
export function assertNoTranslationLocaleConflict(
    translations: VariantDictionaryTranslationInput[] | undefined,
    removeLocales: string[] | undefined,
) {
    if (!translations?.length || !removeLocales?.length) return

    const removable = new Set(removeLocales)
    const conflicting = translations
        .map((translation) => translation.locale)
        .filter((locale) => removable.has(locale))

    if (conflicting.length > 0) {
        throw new VariantDictionaryTranslationInputError(
            `Cannot update and remove the same translation locale: ${conflicting.join(", ")}`,
        )
    }
}

/**
 * Sözlük kayıtlarının (Renk / Malzeme / Ölçü Tipi) çeviri nested write'ı.
 *
 * Üç handler da bunu birebir kopyalıyordu ve üçü de hedef diller için
 * `connectOrCreate` kullanıyordu: çeviri satırı VARSA hiçbir şey yazılmıyor,
 * yani MEVCUT bir çeviri hiçbir zaman güncellenmiyordu. Admin formları da bu
 * yüzden ada bir kez girildikten sonra input'u `disabled` yapıyordu — arayüz
 * backend'in eksiğini gizliyordu. Burada `upsert` kullanılır, böylece hem
 * varsayılan dil hem hedef diller düzeltilebilir.
 *
 * `buildWhere` her modelin kendi bileşik anahtarını kurar
 * (`colorId_locale`, `materialId_locale`, `measurementTypeId_locale`).
 */
export function buildVariantDictionaryTranslationWrites<TWhere>({
    translations,
    removeLocales,
    buildWhere,
}: {
    translations: NormalizedVariantDictionaryTranslation[]
    removeLocales?: TargetLocale[]
    buildWhere: (locale: SupportedLocale) => TWhere
}) {
    if (translations.length === 0 && !removeLocales?.length) return undefined

    return {
        ...(translations.length > 0 && {
            upsert: translations.map((translation) => ({
                where: buildWhere(translation.locale),
                create: translation,
                update: { name: translation.name },
            })),
        }),
        // Varsayılan dil `TargetLocale`'in dışında: kaydın kendi kolonunda yaşar,
        // buradan silinemez — ayrıca filtrelemeye gerek yok, tip zaten engelliyor.
        ...(removeLocales?.length && {
            deleteMany: {
                locale: { in: removeLocales },
            },
        }),
    }
}
