import createError from "http-errors"

import {
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    isSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"

/**
 * Kullanım fonksiyonu (usageFunction) Excel aktarımının SAF katmanı — I/O yok,
 * bu yüzden birim testlenebilir. Prisma'ya dokunan yüzey
 * `industrialUsageFunctions.ts` içinde ve bu modülü kullanır.
 *
 * Korunan invariant (bkz. productIndustrialUsages.ts):
 *  - TR metni HEM `ProductIndustrialUsage.usageFunction` kolonunda HEM de
 *    `locale: "tr"` çeviri satırında yaşar; ikisi birlikte güncellenir.
 *  - TR çeviri satırı hiçbir zaman `imageKey` taşımaz.
 *  - Hedef dil metni, TR metni yokken yazılamaz (fallback anlamını korumak için).
 */

export const USAGE_FUNCTION_MAX_LENGTH = 2000

export type UsageFunctionLocaleMap = Partial<Record<SupportedLocale, string>>

export type IndustrialUsageFunctionRow = {
    usageId: string
    displayOrder: number
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueId: string | null
    /** Yalnız DOLU diller taşınır; boş metinler payload'a hiç girmez. */
    usageFunctions: UsageFunctionLocaleMap
}

/** attributeValueId → locale → ad. Satır başına tekrar etmesin diye sözlük. */
export type IndustrialUsageFunctionTaxonomy = Record<string, UsageFunctionLocaleMap>

export type IndustrialUsageFunctionExport = {
    product: {
        id: string
        code: string
        slug: string
        name: string
        categoryName: string | null
        /** Sayfa başlığında o dilin ürün adını yazabilmek için. */
        names: UsageFunctionLocaleMap
    }
    taxonomy: IndustrialUsageFunctionTaxonomy
    rows: IndustrialUsageFunctionRow[]
}

export type ApplyIndustrialUsageFunctionRow = {
    usageId: string
    usageFunctions: UsageFunctionLocaleMap
}

export type IndustrialUsageFunctionLocaleStats = {
    created: number
    updated: number
    unchanged: number
}

export type IndustrialUsageFunctionApplyStats = {
    touchedRows: number
    created: number
    updated: number
    unchanged: number
    byLocale: Record<string, IndustrialUsageFunctionLocaleStats>
}

export type IndustrialUsageFunctionWritePlan = {
    /** TR metni değişen satırlar: base kolon + `tr` çeviri satırı birlikte yazılır. */
    baseUpdates: Array<{ usageId: string; usageFunction: string }>
    translationWrites: Array<{
        usageId: string
        locale: SupportedLocale
        usageFunction: string
    }>
    stats: IndustrialUsageFunctionApplyStats
}

/** `buildIndustrialUsageFunctionWritePlan`'ın DB'den beklediği minimum durum. */
export type IndustrialUsageFunctionState = {
    id: string
    productId: string
    usageFunction: string | null
    translations: Array<{ locale: string; usageFunction: string | null }>
}

type TranslatedNameSource = {
    id: string
    name: string
    translations: Array<{ locale: string; name: string }>
}

export type IndustrialUsageFunctionProductSource = {
    id: string
    code: string
    name: string
    slug: string
    category: { name: string } | null
    translations: Array<{ locale: string; name: string }>
    industrialUsages: Array<{
        id: string
        displayOrder: number
        usageFunction: string | null
        sectorValue: TranslatedNameSource | null
        productionGroupValue: TranslatedNameSource | null
        usageAreaValue: TranslatedNameSource | null
        translations: Array<{ locale: string; usageFunction: string | null }>
    }>
}

function normalizeText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

function emptyLocaleStats(): IndustrialUsageFunctionLocaleStats {
    return { created: 0, updated: 0, unchanged: 0 }
}

/** Varsayılan dil kaydın kendi kolonundan, hedef diller çeviri satırlarından. */
function collectLocalizedNames(
    baseName: string,
    translations: Array<{ locale: string; name: string }>,
): UsageFunctionLocaleMap {
    const names: UsageFunctionLocaleMap = { [DEFAULT_LOCALE]: baseName }

    for (const translation of translations) {
        if (!isSupportedLocale(translation.locale)) continue
        if (translation.locale === DEFAULT_LOCALE) continue

        const name = normalizeText(translation.name)
        if (name) names[translation.locale] = name
    }

    return names
}

function registerTaxonomyValue(
    value: TranslatedNameSource | null,
    taxonomy: IndustrialUsageFunctionTaxonomy,
) {
    if (!value) return null
    if (!taxonomy[value.id]) {
        taxonomy[value.id] = collectLocalizedNames(value.name, value.translations)
    }
    return value.id
}

/** Prisma satırlarını Excel'in ihtiyaç duyduğu düz payload'a çevirir. */
export function mapIndustrialUsageFunctionExport(
    product: IndustrialUsageFunctionProductSource,
): IndustrialUsageFunctionExport {
    const taxonomy: IndustrialUsageFunctionTaxonomy = {}

    const rows = product.industrialUsages.map((usage) => {
        // TR metni base kolondan okunur: `tr` çeviri satırı onun ikizidir,
        // dolayısıyla ikisinden biri yeterli.
        const usageFunctions: UsageFunctionLocaleMap = {}
        const baseUsageFunction = normalizeText(usage.usageFunction)
        if (baseUsageFunction) usageFunctions[DEFAULT_LOCALE] = baseUsageFunction

        for (const translation of usage.translations) {
            if (!isSupportedLocale(translation.locale)) continue
            if (translation.locale === DEFAULT_LOCALE) continue

            const text = normalizeText(translation.usageFunction)
            if (text) usageFunctions[translation.locale] = text
        }

        return {
            usageId: usage.id,
            displayOrder: usage.displayOrder,
            sectorValueId: registerTaxonomyValue(usage.sectorValue, taxonomy),
            productionGroupValueId: registerTaxonomyValue(usage.productionGroupValue, taxonomy),
            usageAreaValueId: registerTaxonomyValue(usage.usageAreaValue, taxonomy),
            usageFunctions,
        }
    })

    return {
        product: {
            id: product.id,
            code: product.code,
            slug: product.slug,
            name: product.name,
            categoryName: product.category?.name ?? null,
            names: collectLocalizedNames(product.name, product.translations),
        },
        taxonomy,
        rows,
    }
}

/**
 * Kurallar:
 *  - Boş/whitespace metin ATLANIR; içe aktarma hiçbir zaman SİLMEZ. 14 sayfanın
 *    yalnız birkaçı doldurulup yüklenebilsin diye böyle: yarım dosya veri
 *    kaybına yol açmamalı.
 *  - Aynı metin tekrar geldiğinde yazma üretilmez (`unchanged`).
 *  - Hedef dil metni, TR metni ne DB'de ne de aynı dosyada varsa reddedilir.
 */
export function buildIndustrialUsageFunctionWritePlan({
    productId,
    rows,
    usages,
}: {
    productId: string
    rows: ApplyIndustrialUsageFunctionRow[]
    usages: IndustrialUsageFunctionState[]
}): IndustrialUsageFunctionWritePlan {
    const usagesById = new Map(usages.map((usage) => [usage.id, usage]))
    const errors: string[] = []

    const baseUpdates: IndustrialUsageFunctionWritePlan["baseUpdates"] = []
    const translationWrites: IndustrialUsageFunctionWritePlan["translationWrites"] = []
    const stats: IndustrialUsageFunctionApplyStats = {
        touchedRows: 0,
        created: 0,
        updated: 0,
        unchanged: 0,
        byLocale: {},
    }

    const seenUsageIds = new Set<string>()

    for (const row of rows) {
        if (seenUsageIds.has(row.usageId)) {
            errors.push(`Kullanım satırı dosyada birden fazla kez geçiyor: ${row.usageId}`)
            continue
        }
        seenUsageIds.add(row.usageId)

        const usage = usagesById.get(row.usageId)
        if (!usage) {
            errors.push(`Kullanım satırı bulunamadı: ${row.usageId}`)
            continue
        }
        if (usage.productId !== productId) {
            errors.push(`Kullanım satırı bu ürüne ait değil: ${row.usageId}`)
            continue
        }

        const currentByLocale = new Map<string, string | null>()
        currentByLocale.set(DEFAULT_LOCALE, normalizeText(usage.usageFunction))
        for (const translation of usage.translations) {
            if (translation.locale === DEFAULT_LOCALE) continue
            currentByLocale.set(translation.locale, normalizeText(translation.usageFunction))
        }

        const localesWithExistingText = new Set(
            usage.translations
                .filter((translation) => normalizeText(translation.usageFunction))
                .map((translation) => translation.locale),
        )

        const incomingDefault = normalizeText(row.usageFunctions[DEFAULT_LOCALE])
        const hasDefaultText = Boolean(incomingDefault ?? currentByLocale.get(DEFAULT_LOCALE))
        let rowTouched = false

        for (const locale of SUPPORTED_LOCALES) {
            const incoming = normalizeText(row.usageFunctions[locale])
            if (!incoming) continue

            if (incoming.length > USAGE_FUNCTION_MAX_LENGTH) {
                errors.push(
                    `Kullanım satırı ${row.usageId} · ${locale}: metin ${USAGE_FUNCTION_MAX_LENGTH} karakter sınırını aşıyor (${incoming.length})`,
                )
                continue
            }

            if (locale !== DEFAULT_LOCALE && !hasDefaultText) {
                errors.push(
                    `Kullanım satırı ${row.usageId} · ${locale}: Türkçe metin girilmeden çeviri kaydedilemez`,
                )
                continue
            }

            stats.byLocale[locale] ??= emptyLocaleStats()

            // Metin aynıysa yazma üretilmez. TR'de metin aynı ama `tr` çeviri
            // satırı eksikse de dokunulmaz: o legacy durumun sahibi
            // backfill-product-industrial-usage-translations script'idir.
            if (currentByLocale.get(locale) === incoming) {
                stats.unchanged += 1
                stats.byLocale[locale].unchanged += 1
                continue
            }

            const hadText =
                locale === DEFAULT_LOCALE
                    ? Boolean(currentByLocale.get(DEFAULT_LOCALE))
                    : localesWithExistingText.has(locale)

            if (hadText) {
                stats.updated += 1
                stats.byLocale[locale].updated += 1
            } else {
                stats.created += 1
                stats.byLocale[locale].created += 1
            }

            if (locale === DEFAULT_LOCALE) {
                baseUpdates.push({ usageId: usage.id, usageFunction: incoming })
            }

            translationWrites.push({ usageId: usage.id, locale, usageFunction: incoming })

            rowTouched = true
        }

        if (rowTouched) stats.touchedRows += 1
    }

    if (errors.length > 0) {
        throw new createError.BadRequest(errors.join("\n"))
    }

    return { baseUpdates, translationWrites, stats }
}
