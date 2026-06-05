import createError from "http-errors"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"

export const INDUSTRIAL_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const INDUSTRIAL_ATTRIBUTE_CODE_SET = new Set<string>(Object.values(INDUSTRIAL_ATTRIBUTE_CODES))

type AttributeValueLookup = NonNullable<Awaited<ReturnType<IPrismaProductAttributeValueRepository["getValueById"]>>>

export type ProductIndustrialUsageInput = {
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueId?: string | null
    usageFunction?: string | null
    imageKey?: string | null
    displayOrder?: number | null
}

export type NormalizedProductIndustrialUsage = {
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueId: string | null
    usageFunction: string | null
    imageKey: string | null
    displayOrder: number
}

export function buildProductIndustrialUsageCreateInputs(rows: NormalizedProductIndustrialUsage[]) {
    return rows.map((row) => ({
        usageFunction: row.usageFunction,
        imageKey: row.imageKey,
        displayOrder: row.displayOrder,
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
            sectorValueId,
            productionGroupValueId,
            usageAreaValueId,
            usageFunction,
            imageKey,
            displayOrder: Number.isInteger(row.displayOrder) && Number(row.displayOrder) >= 0
                ? Number(row.displayOrder)
                : index,
        })
    }

    return normalizedRows
}
