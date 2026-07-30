import createError from "http-errors"
import type {
    IPrismaProductAttributeValueRepository,
    ProductAttributeValueValidationRow,
} from "@/core/helpers/prisma/productAttributeValues/repository"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from "@/core/i18n/locales"
import type { Prisma } from "@/prisma/generated/prisma/client"

export const INDUSTRIAL_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const INDUSTRIAL_ATTRIBUTE_CODE_SET = new Set<string>(Object.values(INDUSTRIAL_ATTRIBUTE_CODES))

export type ProductIndustrialUsageInput = {
    id?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueId?: string | null
    usageFunction?: string | null
    translations?: ProductIndustrialUsageTranslationInput[] | null
    imageKey?: string | null
    displayOrder?: number | null
}

export type ProductIndustrialUsageTranslationInput = {
    locale: string
    usageFunction?: string | null
    imageKey?: string | null
}

export type NormalizedProductIndustrialUsageTranslation = {
    locale: SupportedLocale
    usageFunction: string | null
    imageKey: string | null
}

export type NormalizedProductIndustrialUsage = {
    id: string | null
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueId: string | null
    usageFunction: string | null
    translations: NormalizedProductIndustrialUsageTranslation[]
    createOnlyTranslations: NormalizedProductIndustrialUsageTranslation[]
    imageKey: string | null
    displayOrder: number
}

/**
 * TR satırı her zaman legacy `usageFunction` kolonundan türer ve `imageKey`
 * taşımaz — TR/varsayılan görsel `ProductIndustrialUsage.imageKey`'de yaşar.
 * Bu invariant sayesinde admin (locale=tr) çağrısında çözümlenen görsel her
 * zaman base kolonun değeridir; bkz. localizeProductIndustrialUsage.
 *
 * Hedef locale satırı METİN VEYA GÖRSEL doluysa korunur: görselde yazı olduğu
 * için yalnız görseli çevrilen satırlar geçerli bir senaryo.
 */
function normalizeProductIndustrialUsageTranslations({
    usageFunction,
    translations,
}: {
    usageFunction: string | null
    translations?: ProductIndustrialUsageTranslationInput[] | null
}) {
    const byLocale = new Map<SupportedLocale, NormalizedProductIndustrialUsageTranslation>()

    if (usageFunction) {
        byLocale.set(DEFAULT_LOCALE, {
            locale: DEFAULT_LOCALE,
            usageFunction,
            imageKey: null,
        })
    }

    for (const translation of translations ?? []) {
        if (!isSupportedLocale(translation.locale)) {
            throw new createError.BadRequest(`Unsupported industrial usage translation locale: ${translation.locale}`)
        }

        if (translation.locale === DEFAULT_LOCALE) continue

        const translatedUsageFunction = translation.usageFunction?.trim() || null
        const translatedImageKey = translation.imageKey?.trim() || null

        if (!translatedUsageFunction && !translatedImageKey) continue

        // Metin çevirisi kaynak metne bağlıdır (fallback anlamını korumak için);
        // görsel çevirisi bağımsızdır.
        if (translatedUsageFunction && !usageFunction) {
            throw new createError.BadRequest("Turkish usageFunction is required before target translations")
        }

        const existing = byLocale.get(translation.locale)
        if (
            existing &&
            (existing.usageFunction !== translatedUsageFunction || existing.imageKey !== translatedImageKey)
        ) {
            throw new createError.BadRequest(`Duplicate industrial usage translation locale: ${translation.locale}`)
        }

        byLocale.set(translation.locale, {
            locale: translation.locale,
            usageFunction: translatedUsageFunction,
            imageKey: translatedImageKey,
        })
    }

    const normalized = [...byLocale.values()]

    return {
        translations: normalized,
        createOnlyTranslations: normalized.filter((translation) => translation.locale !== DEFAULT_LOCALE),
    }
}

export function buildProductIndustrialUsageCreateInputs(rows: NormalizedProductIndustrialUsage[]) {
    return rows.map((row) => ({
        usageFunction: row.usageFunction,
        imageKey: row.imageKey,
        displayOrder: row.displayOrder,
        ...(row.translations.length > 0 && {
            translations: {
                create: row.translations,
            },
        }),
        ...(row.sectorValueId && {
            sectorValue: {
                connect: { id: row.sectorValueId },
            },
        }),
        ...(row.productionGroupValueId && {
            productionGroupValue: {
                connect: { id: row.productionGroupValueId },
            },
        }),
        ...(row.usageAreaValueId && {
            usageAreaValue: {
                connect: { id: row.usageAreaValueId },
            },
        }),
    }))
}

export function buildProductIndustrialUsageUpdateInput(
    row: NormalizedProductIndustrialUsage,
): Prisma.ProductIndustrialUsageUpdateWithoutProductInput {
    const translationUpserts = row.translations.map((translation) => ({
        where: {
            productIndustrialUsageId_locale: {
                productIndustrialUsageId: row.id!,
                locale: translation.locale,
            },
        },
        create: {
            locale: translation.locale,
            usageFunction: translation.usageFunction,
            imageKey: translation.imageKey,
        },
        update: {
            usageFunction: translation.usageFunction,
            imageKey: translation.imageKey,
        },
    }))

    // Payload'da karşılığı kalmayan her locale silinir. Eskiden yalnız
    // `locale: DEFAULT_LOCALE` siliniyordu; bu yüzden admin EN metnini
    // boşalttığında DB'deki EN satırı kalıyor ve public EN sayfada eski metin
    // görünmeye devam ediyordu.
    const keptLocales = new Set<string>(row.translations.map((translation) => translation.locale))
    const localesToDelete = SUPPORTED_LOCALES.filter((locale) => !keptLocales.has(locale))

    const translationWrites: Prisma.ProductIndustrialUsageTranslationUpdateManyWithoutProductIndustrialUsageNestedInput = {
        ...(translationUpserts.length > 0 && {
            upsert: translationUpserts,
        }),
        ...(localesToDelete.length > 0 && {
            deleteMany: {
                locale: { in: [...localesToDelete] },
            },
        }),
    }

    return {
        usageFunction: row.usageFunction,
        imageKey: row.imageKey,
        displayOrder: row.displayOrder,
        sectorValue: row.sectorValueId
            ? { connect: { id: row.sectorValueId } }
            : { disconnect: true },
        productionGroupValue: row.productionGroupValueId
            ? { connect: { id: row.productionGroupValueId } }
            : { disconnect: true },
        usageAreaValue: row.usageAreaValueId
            ? { connect: { id: row.usageAreaValueId } }
            : { disconnect: true },
        translations: translationWrites,
    }
}

type ValidationLookup = Map<string, ProductAttributeValueValidationRow>

/** Verilen ID'leri TEK sorguda çeker ve id→satır sözlüğü döndürür. */
async function loadValidationLookup(
    repository: IPrismaProductAttributeValueRepository,
    valueIds: Array<string | null | undefined>,
): Promise<ValidationLookup> {
    const uniqueIds = Array.from(new Set(valueIds.filter((id): id is string => Boolean(id))))
    const rows = await repository.getValuesForValidation(uniqueIds)
    return new Map(rows.map((row) => [row.id, row]))
}

function getAttributeValueOrThrow(
    lookup: ValidationLookup,
    valueId: string,
): ProductAttributeValueValidationRow {
    const value = lookup.get(valueId)
    if (!value) {
        throw new createError.BadRequest("Selected industrial usage attribute value does not exist")
    }
    if (!value.isActive || !value.attribute?.isActive) {
        throw new createError.BadRequest("Selected industrial usage attribute value is inactive")
    }
    return value
}

function validateAttributeValueCode(
    lookup: ValidationLookup,
    valueId: string | null | undefined,
    expectedCode: string,
    fieldLabel: string,
) {
    if (!valueId) return null

    const value = getAttributeValueOrThrow(lookup, valueId)
    if (value.attribute.code !== expectedCode) {
        throw new createError.BadRequest(`${fieldLabel} must reference a ${expectedCode} attribute value`)
    }

    return value.id
}

export async function assertNoIndustrialAttributeValues(
    repository: IPrismaProductAttributeValueRepository,
    attributeValueIds?: string[] | null,
) {
    if (!attributeValueIds?.length) return

    const lookup = await loadValidationLookup(repository, attributeValueIds)
    const values = Array.from(new Set(attributeValueIds)).map((valueId) =>
        getAttributeValueOrThrow(lookup, valueId),
    )
    const industrialValues = values.filter((value) => INDUSTRIAL_ATTRIBUTE_CODE_SET.has(value.attribute.code))

    if (industrialValues.length > 0) {
        throw new createError.BadRequest(
            "sector, production_group and usage_area must be saved through industrialUsages, not attributeValueIds",
        )
    }
}

function isAttributeValueAllowedWithParents(
    allowedIds: Set<string>,
    value: ProductAttributeValueValidationRow | undefined,
) {
    if (!value?.id) return false
    if (allowedIds.has(value.id)) return true
    if (value.parentValueId && allowedIds.has(value.parentValueId)) return true
    if (value.parentValue?.id && allowedIds.has(value.parentValue.id)) return true
    if (value.parentValue?.parentValueId && allowedIds.has(value.parentValue.parentValueId)) return true
    if (value.parentValue?.parentValue?.id && allowedIds.has(value.parentValue.parentValue.id)) return true
    return false
}

/**
 * Kategorinin `allowedAttributeValueIds` allowlist'ine uygunluk kontrolü.
 * Daha önce create ve update handler'larında birebir kopyalanmış hâlde duruyordu
 * ve ID başına bir `getValueById` çağırıyordu; artık tek toplu sorgudan besleniyor.
 */
export async function assertAttributeValuesAllowedForCategory(
    repository: IPrismaProductAttributeValueRepository,
    attributeValueIds: string[] | null | undefined,
    allowedAttributeValueIds: string[] | null | undefined,
) {
    if (!attributeValueIds?.length) return
    if (!allowedAttributeValueIds?.length) return

    const lookup = await loadValidationLookup(repository, attributeValueIds)
    const allowedSet = new Set(allowedAttributeValueIds)

    const hasInvalidValue = attributeValueIds.some(
        (valueId) => !isAttributeValueAllowedWithParents(allowedSet, lookup.get(valueId)),
    )

    if (hasInvalidValue) {
        throw new createError.BadRequest("Some selected attribute values are not allowed for this category")
    }
}

export async function normalizeProductIndustrialUsages(
    repository: IPrismaProductAttributeValueRepository,
    industrialUsages?: ProductIndustrialUsageInput[] | null,
): Promise<NormalizedProductIndustrialUsage[]> {
    if (!industrialUsages?.length) return []

    // Tüm satırlardaki taxonomy ID'leri TEK sorguda çekilir. Eskiden satır başına
    // 3 ardışık `getValueById` vardı (100 satır → 300 sorgu). Doğrulama sırası
    // korunuyor: satırlar aynı sırayla, alanlar sector → productionGroup →
    // usageArea sırasıyla kontrol edildiği için ilk-hata davranışı değişmiyor.
    const lookup = await loadValidationLookup(
        repository,
        industrialUsages.flatMap((row) => [
            row.sectorValueId,
            row.productionGroupValueId,
            row.usageAreaValueId,
        ]),
    )

    const normalizedRows: NormalizedProductIndustrialUsage[] = []

    for (const [index, row] of industrialUsages.entries()) {
        const usageFunction = row.usageFunction?.trim() || null
        const translationState = normalizeProductIndustrialUsageTranslations({
            usageFunction,
            translations: row.translations,
        })
        const imageKey = row.imageKey?.trim() || null
        const sectorValueId = validateAttributeValueCode(
            lookup,
            row.sectorValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.sector,
            "sectorValueId",
        )
        const productionGroupValueId = validateAttributeValueCode(
            lookup,
            row.productionGroupValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.productionGroup,
            "productionGroupValueId",
        )
        const usageAreaValueId = validateAttributeValueCode(
            lookup,
            row.usageAreaValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.usageArea,
            "usageAreaValueId",
        )

        // Locale'e özgü görsel/metin de "dolu satır" sayılır: yalnız EN görseli
        // yüklenmiş bir satır sessizce düşmemeli.
        const hasTranslationContent = translationState.translations.some(
            (translation) => translation.usageFunction || translation.imageKey,
        )

        if (
            !sectorValueId &&
            !productionGroupValueId &&
            !usageAreaValueId &&
            !usageFunction &&
            !imageKey &&
            !hasTranslationContent
        ) {
            continue
        }

        if (!sectorValueId && !productionGroupValueId && !usageAreaValueId) {
            throw new createError.BadRequest("Industrial usage rows require at least one taxonomy value")
        }

        normalizedRows.push({
            id: row.id?.trim() || null,
            sectorValueId,
            productionGroupValueId,
            usageAreaValueId,
            usageFunction,
            translations: translationState.translations,
            createOnlyTranslations: translationState.createOnlyTranslations,
            imageKey,
            displayOrder: Number.isInteger(row.displayOrder) && Number(row.displayOrder) >= 0
                ? Number(row.displayOrder)
                : index,
        })
    }

    return normalizedRows
}
