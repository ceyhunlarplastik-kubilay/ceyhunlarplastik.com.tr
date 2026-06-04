import { prisma } from "@/core/db/prisma"
import { CUSTOMER_ATTRIBUTE_CODES } from "@/core/helpers/crm/customerAttributes"
import { customerProductInclude } from "@/core/helpers/prisma/customers/repository"
import type { Prisma } from "@/prisma/generated/prisma/client"

export type CustomerFeaturedAndMatchedProductSource = "MANUAL" | "ATTRIBUTE_MATCH"

type ProductWithRelations = Prisma.ProductGetPayload<{
    include: typeof customerProductInclude.product.include
}>

export type CustomerFeaturedAndMatchedProduct = {
    id: string
    customerId: string
    productId: string
    displayOrder: number
    createdByUserId?: string | null
    createdAt?: Date
    updatedAt?: Date
    createdByUser?: any
    product: ProductWithRelations
    source: CustomerFeaturedAndMatchedProductSource
    isProfileMatched?: boolean
    matchedAttributeValueIds?: string[]
    matchedAttributeLabels?: string[]
}

function collectMatchedHierarchyValues(
    product: ProductWithRelations,
    selected: {
        sectorValueId?: string | null
        productionGroupValueId?: string | null
        usageAreaValueIds: string[]
    },
) {
    const matchedValues = new Map<string, string>()

    for (const usage of product.industrialUsages ?? []) {
        const sectorValue = usage.sectorValue
        const productionGroupValue = usage.productionGroupValue
        const usageAreaValue = usage.usageAreaValue

        if (usageAreaValue && selected.usageAreaValueIds.includes(usageAreaValue.id)) {
            matchedValues.set(usageAreaValue.id, usageAreaValue.name)
            continue
        }

        if (selected.productionGroupValueId) {
            if (
                productionGroupValue?.id === selected.productionGroupValueId ||
                usageAreaValue?.parentValueId === selected.productionGroupValueId
            ) {
                const matched = productionGroupValue?.id === selected.productionGroupValueId
                    ? productionGroupValue
                    : usageAreaValue
                if (matched) matchedValues.set(matched.id, matched.name)
                continue
            }
        }

        if (selected.sectorValueId) {
            const directSectorMatch = sectorValue?.id === selected.sectorValueId
            const productionGroupSectorMatch = productionGroupValue?.parentValueId === selected.sectorValueId
            const usageAreaSectorMatch = usageAreaValue?.parentValue?.parentValueId === selected.sectorValueId

            if (directSectorMatch || productionGroupSectorMatch || usageAreaSectorMatch) {
                const matched = directSectorMatch
                    ? sectorValue
                    : productionGroupSectorMatch
                        ? productionGroupValue
                        : usageAreaValue
                if (matched) matchedValues.set(matched.id, matched.name)
            }
        }
    }

    return {
        matchedAttributeValueIds: Array.from(matchedValues.keys()),
        matchedAttributeLabels: Array.from(matchedValues.values()),
    }
}

export async function getCustomerFeaturedAndMatchedProducts(
    customerId: string,
): Promise<CustomerFeaturedAndMatchedProduct[]> {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            id: true,
            sectorValueId: true,
            productionGroupValueId: true,
            usageAreaValues: {
                select: {
                    id: true,
                },
            },
            attributeValueAssignments: {
                orderBy: {
                    createdAt: "asc",
                },
                include: {
                    attributeValue: {
                        include: {
                            attribute: true,
                        },
                    },
                },
            },
            featuredProducts: {
                orderBy: {
                    displayOrder: "asc",
                },
                include: customerProductInclude,
            },
        },
    })

    if (!customer) return []

    const assignedSectorValueId = customer.attributeValueAssignments.find(
        (assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.sector,
    )?.attributeValueId ?? null

    const assignedProductionGroupValueId = customer.attributeValueAssignments.find(
        (assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.productionGroup,
    )?.attributeValueId ?? null

    const assignedUsageAreaValueIds = customer.attributeValueAssignments
        .filter((assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.usageArea)
        .map((assignment) => assignment.attributeValueId)

    const selectedHierarchy = {
        sectorValueId: customer.sectorValueId ?? assignedSectorValueId,
        productionGroupValueId: customer.productionGroupValueId ?? assignedProductionGroupValueId,
        usageAreaValueIds: Array.from(new Set([
            ...customer.usageAreaValues.map((value) => value.id),
            ...assignedUsageAreaValueIds,
        ])),
    }

    const productWhereClauses: Prisma.ProductWhereInput[] = []

    if (selectedHierarchy.sectorValueId) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    OR: [
                        {
                            sectorValueId: selectedHierarchy.sectorValueId,
                        },
                        {
                            productionGroupValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.productionGroup },
                                parentValueId: selectedHierarchy.sectorValueId,
                            },
                        },
                        {
                            usageAreaValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.usageArea },
                                parentValue: {
                                    parentValueId: selectedHierarchy.sectorValueId,
                                },
                            },
                        },
                    ],
                },
            },
        })
    }

    if (selectedHierarchy.productionGroupValueId) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    OR: [
                        {
                            productionGroupValueId: selectedHierarchy.productionGroupValueId,
                        },
                        {
                            usageAreaValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.usageArea },
                                parentValueId: selectedHierarchy.productionGroupValueId,
                            },
                        },
                    ],
                },
            },
        })
    }

    if (selectedHierarchy.usageAreaValueIds.length > 0) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    usageAreaValueId: {
                        in: selectedHierarchy.usageAreaValueIds,
                    },
                },
            },
        })
    }

    const buildManualItems = (matchedProductsById = new Map<string, ReturnType<typeof collectMatchedHierarchyValues>>()) =>
        customer.featuredProducts.map((item) => {
            const matched = matchedProductsById.get(item.productId)

            return {
                ...item,
                source: "MANUAL" as const,
                isProfileMatched: Boolean(matched),
                matchedAttributeValueIds: matched?.matchedAttributeValueIds ?? [],
                matchedAttributeLabels: matched?.matchedAttributeLabels ?? [],
            }
        }) satisfies CustomerFeaturedAndMatchedProduct[]

    if (productWhereClauses.length === 0) {
        return buildManualItems()
    }

    const matchedProducts = await prisma.product.findMany({
        where: {
            OR: productWhereClauses,
        },
        include: customerProductInclude.product.include,
        orderBy: {
            code: "asc",
        },
    })

    const matchedProductsById = new Map(
        matchedProducts.map((product) => [
            product.id,
            collectMatchedHierarchyValues(product, selectedHierarchy),
        ]),
    )

    const manualItems = buildManualItems(matchedProductsById)

    const manualProductIds = new Set(manualItems.map((item) => item.productId))

    const attributeMatchedItems = matchedProducts
        .filter((product) => !manualProductIds.has(product.id))
        .map((product, index) => {
            const matched = matchedProductsById.get(product.id) ?? collectMatchedHierarchyValues(product, selectedHierarchy)

            return {
                id: product.id,
                customerId,
                productId: product.id,
                displayOrder: manualItems.length + index,
                product,
                source: "ATTRIBUTE_MATCH" as const,
                isProfileMatched: true,
                matchedAttributeValueIds: matched.matchedAttributeValueIds,
                matchedAttributeLabels: matched.matchedAttributeLabels,
            }
        })

    return [...manualItems, ...attributeMatchedItems]
}
