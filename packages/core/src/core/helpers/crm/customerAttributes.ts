import createError from "http-errors"
import { getEffectiveCustomerAssignable } from "../productAttributes/customerAssignableAttributes"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import type { CustomerAttributeValueAssignmentSource } from "@/prisma/generated/prisma/enums"

export const CUSTOMER_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

const HIERARCHY_ATTRIBUTE_CODES = new Set<string>([
    CUSTOMER_ATTRIBUTE_CODES.sector,
    CUSTOMER_ATTRIBUTE_CODES.productionGroup,
    CUSTOMER_ATTRIBUTE_CODES.usageArea,
])

type CustomerAttributeInput = {
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
    attributeValueIds?: string[]
}

export async function validateCustomerAttributeSelection(
    productAttributeValueRepository: IPrismaProductAttributeValueRepository,
    input: CustomerAttributeInput,
) {
    const { sectorValueId, productionGroupValueId } = input

    const sectorValue = sectorValueId
        ? await productAttributeValueRepository.getValueById(sectorValueId)
        : null

    if (sectorValue && sectorValue.attribute.code !== CUSTOMER_ATTRIBUTE_CODES.sector) {
        throw new createError.BadRequest("sectorValueId must reference a sector value")
    }
    if (sectorValue && (!sectorValue.isActive || !sectorValue.attribute.isActive)) {
        throw new createError.BadRequest("sectorValueId must reference an active sector value")
    }

    const productionGroupValue = productionGroupValueId
        ? await productAttributeValueRepository.getValueById(productionGroupValueId)
        : null

    if (productionGroupValue && productionGroupValue.attribute.code !== CUSTOMER_ATTRIBUTE_CODES.productionGroup) {
        throw new createError.BadRequest("productionGroupValueId must reference a production_group value")
    }
    if (productionGroupValue && (!productionGroupValue.isActive || !productionGroupValue.attribute.isActive)) {
        throw new createError.BadRequest("productionGroupValueId must reference an active production_group value")
    }

    if (
        sectorValue &&
        productionGroupValue &&
        productionGroupValue.parentValueId !== sectorValue.id
    ) {
        throw new createError.BadRequest("production_group must belong to selected sector")
    }

    const usageAreaIds = Array.from(new Set((input.usageAreaValueIds ?? []).filter(Boolean)))
    const usageAreaValues = await Promise.all(
        usageAreaIds.map((id) => productAttributeValueRepository.getValueById(id)),
    )

    for (const value of usageAreaValues) {
        if (!value) throw new createError.BadRequest("One or more usage_area values are invalid")
        if (value.attribute.code !== CUSTOMER_ATTRIBUTE_CODES.usageArea) {
            throw new createError.BadRequest("usageAreaValueIds must reference usage_area values")
        }
        if (!value.isActive || !value.attribute.isActive) {
            throw new createError.BadRequest("usageAreaValueIds must reference active usage_area values")
        }

        if (productionGroupValue && value.parentValueId !== productionGroupValue.id) {
            throw new createError.BadRequest("usage_area must belong to selected production_group")
        }

        if (sectorValue) {
            const usageSectorId = value.parentValue?.parentValueId
            if (usageSectorId && usageSectorId !== sectorValue.id) {
                throw new createError.BadRequest("usage_area must belong to selected sector")
            }
        }
    }

    return {
        sectorValue,
        productionGroupValue,
        usageAreaIds,
    }
}

type ResolvedCustomerAttributeAssignments = {
    source: CustomerAttributeValueAssignmentSource
    assignmentValueIds: string[]
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaIds: string[]
}

function getUniqueIds(ids: Array<string | null | undefined>) {
    return Array.from(new Set(ids.filter((value): value is string => Boolean(value))))
}

export function hasCustomerAttributeInput(input: CustomerAttributeInput) {
    return (
        input.attributeValueIds !== undefined ||
        input.sectorValueId !== undefined ||
        input.productionGroupValueId !== undefined ||
        input.usageAreaValueIds !== undefined
    )
}

export async function resolveCustomerAttributeAssignments(
    productAttributeValueRepository: IPrismaProductAttributeValueRepository,
    input: CustomerAttributeInput,
): Promise<ResolvedCustomerAttributeAssignments | null> {
    if (!hasCustomerAttributeInput(input)) return null

    if (input.attributeValueIds !== undefined) {
        const requestedIds = getUniqueIds(input.attributeValueIds)
        const requestedValues = await Promise.all(
            requestedIds.map((id) => productAttributeValueRepository.getValueById(id)),
        )

        const valuesByCode = new Map<string, string[]>()

        requestedValues.forEach((value, index) => {
            if (!value) {
                throw new createError.BadRequest("One or more customer attribute values are invalid")
            }
            if (!value.isActive || !value.attribute.isActive) {
                throw new createError.BadRequest("Inactive customer attribute values cannot be assigned")
            }
            if (!getEffectiveCustomerAssignable(value.attribute)) {
                throw new createError.BadRequest(`${value.attribute.name} customer profile selection is not allowed`)
            }

            const existing = valuesByCode.get(value.attribute.code) ?? []
            existing.push(requestedIds[index])
            valuesByCode.set(value.attribute.code, existing)
        })

        const sectorIds = valuesByCode.get(CUSTOMER_ATTRIBUTE_CODES.sector) ?? []
        const productionGroupIds = valuesByCode.get(CUSTOMER_ATTRIBUTE_CODES.productionGroup) ?? []
        const usageAreaIds = valuesByCode.get(CUSTOMER_ATTRIBUTE_CODES.usageArea) ?? []

        if (sectorIds.length > 1) {
            throw new createError.BadRequest("Only one sector value can be assigned to a customer")
        }
        if (productionGroupIds.length > 1) {
            throw new createError.BadRequest("Only one production_group value can be assigned to a customer")
        }

        await validateCustomerAttributeSelection(productAttributeValueRepository, {
            sectorValueId: sectorIds[0] ?? null,
            productionGroupValueId: productionGroupIds[0] ?? null,
            usageAreaValueIds: usageAreaIds,
        })

        return {
            source: "MANUAL",
            assignmentValueIds: requestedIds,
            sectorValueId: sectorIds[0] ?? null,
            productionGroupValueId: productionGroupIds[0] ?? null,
            usageAreaIds,
        }
    }

    const { usageAreaIds } = await validateCustomerAttributeSelection(productAttributeValueRepository, input)
    const sectorValueId = input.sectorValueId ?? null
    const productionGroupValueId = input.productionGroupValueId ?? null

    return {
        source: "MANUAL",
        assignmentValueIds: getUniqueIds([
            sectorValueId,
            productionGroupValueId,
            ...usageAreaIds,
        ]),
        sectorValueId,
        productionGroupValueId,
        usageAreaIds,
    }
}

export function isHierarchyCustomerAttributeCode(attributeCode: string) {
    return HIERARCHY_ATTRIBUTE_CODES.has(attributeCode)
}
