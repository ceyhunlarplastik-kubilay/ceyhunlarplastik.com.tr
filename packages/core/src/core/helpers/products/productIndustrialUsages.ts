import createError from "http-errors"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/core/i18n/locales"
import type { Prisma } from "@/prisma/generated/prisma/client"

export const INDUSTRIAL_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const INDUSTRIAL_ATTRIBUTE_CODE_SET = new Set<string>(Object.values(INDUSTRIAL_ATTRIBUTE_CODES))

type AttributeValueLookup = NonNullable<Awaited<ReturnType<IPrismaProductAttributeValueRepository["getValueById"]>>>

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
}

export type NormalizedProductIndustrialUsageTranslation = {
    locale: SupportedLocale
    usageFunction: string
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
        })
    }

    for (const translation of translations ?? []) {
        if (!isSupportedLocale(translation.locale)) {
            throw new createError.BadRequest(`Unsupported industrial usage translation locale: ${translation.locale}`)
        }

        if (translation.locale === DEFAULT_LOCALE) continue

        const translatedUsageFunction = translation.usageFunction?.trim()
        if (!translatedUsageFunction) continue
        if (!usageFunction) {
            throw new createError.BadRequest("Turkish usageFunction is required before target translations")
        }

        const existing = byLocale.get(translation.locale)
        if (existing && existing.usageFunction !== translatedUsageFunction) {
            throw new createError.BadRequest(`Duplicate industrial usage translation locale: ${translation.locale}`)
        }

        byLocale.set(translation.locale, {
            locale: translation.locale,
            usageFunction: translatedUsageFunction,
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
    const translationUpserts = [
        ...(row.usageFunction
            ? [{
                where: {
                    productIndustrialUsageId_locale: {
                        productIndustrialUsageId: row.id!,
                        locale: DEFAULT_LOCALE,
                    },
                },
                create: {
                    locale: DEFAULT_LOCALE,
                    usageFunction: row.usageFunction,
                },
                update: {
                    usageFunction: row.usageFunction,
                },
            }]
            : []),
        ...row.createOnlyTranslations.map((translation) => ({
            where: {
                productIndustrialUsageId_locale: {
                    productIndustrialUsageId: row.id!,
                    locale: translation.locale,
                },
            },
            create: translation,
            update: {
                usageFunction: translation.usageFunction,
            },
        })),
    ]
    const translationWrites: Prisma.ProductIndustrialUsageTranslationUpdateManyWithoutProductIndustrialUsageNestedInput = {
        ...(translationUpserts.length > 0 && {
            upsert: translationUpserts,
        }),
        ...(!row.usageFunction && {
            deleteMany: {
                locale: DEFAULT_LOCALE,
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

async function getAttributeValueOrThrow(
    repository: IPrismaProductAttributeValueRepository,
    valueId: string,
): Promise<AttributeValueLookup> {
    const value = await repository.getValueById(valueId)
    if (!value) {
        throw new createError.BadRequest("Selected industrial usage attribute value does not exist")
    }
    if (!value.isActive || !value.attribute?.isActive) {
        throw new createError.BadRequest("Selected industrial usage attribute value is inactive")
    }
    return value
}

async function validateAttributeValueCode(
    repository: IPrismaProductAttributeValueRepository,
    valueId: string | null | undefined,
    expectedCode: string,
    fieldLabel: string,
) {
    if (!valueId) return null

    const value = await getAttributeValueOrThrow(repository, valueId)
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

    const values = await Promise.all(
        Array.from(new Set(attributeValueIds)).map((valueId) => getAttributeValueOrThrow(repository, valueId)),
    )
    const industrialValues = values.filter((value) => INDUSTRIAL_ATTRIBUTE_CODE_SET.has(value.attribute.code))

    if (industrialValues.length > 0) {
        throw new createError.BadRequest(
            "sector, production_group and usage_area must be saved through industrialUsages, not attributeValueIds",
        )
    }
}

export async function normalizeProductIndustrialUsages(
    repository: IPrismaProductAttributeValueRepository,
    industrialUsages?: ProductIndustrialUsageInput[] | null,
): Promise<NormalizedProductIndustrialUsage[]> {
    if (!industrialUsages?.length) return []

    const normalizedRows: NormalizedProductIndustrialUsage[] = []

    for (const [index, row] of industrialUsages.entries()) {
        const usageFunction = row.usageFunction?.trim() || null
        const translationState = normalizeProductIndustrialUsageTranslations({
            usageFunction,
            translations: row.translations,
        })
        const imageKey = row.imageKey?.trim() || null
        const sectorValueId = await validateAttributeValueCode(
            repository,
            row.sectorValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.sector,
            "sectorValueId",
        )
        const productionGroupValueId = await validateAttributeValueCode(
            repository,
            row.productionGroupValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.productionGroup,
            "productionGroupValueId",
        )
        const usageAreaValueId = await validateAttributeValueCode(
            repository,
            row.usageAreaValueId,
            INDUSTRIAL_ATTRIBUTE_CODES.usageArea,
            "usageAreaValueId",
        )

        if (!sectorValueId && !productionGroupValueId && !usageAreaValueId && !usageFunction && !imageKey) {
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
