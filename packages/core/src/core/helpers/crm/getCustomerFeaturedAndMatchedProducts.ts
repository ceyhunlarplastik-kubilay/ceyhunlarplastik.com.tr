import { prisma } from "@/core/db/prisma"
import { customerProductInclude } from "@/core/helpers/prisma/customers/repository"
import {
    buildCustomerProfileProductWhereClauses,
    resolveCustomerProfileHierarchy,
} from "@/core/helpers/crm/customerProfileMatching"
import type { Prisma } from "@/prisma/generated/prisma/client"

// Geriye dönük yüzey: bu iki fonksiyon artık saf modülde yaşıyor.
export {
    buildCustomerProfileProductWhereClauses,
    resolveCustomerProfileHierarchy,
} from "@/core/helpers/crm/customerProfileMatching"
export type { CustomerProfileHierarchy } from "@/core/helpers/crm/customerProfileMatching"

// "İlgili Ürünler" artık yalnızca profil eşleşmesinden türer; manuel insan seçimi
// (CustomerFeaturedProduct) kaldırıldı. `source` alanı geriye dönük uyum için
// sabit "ATTRIBUTE_MATCH" olarak kalıyor.
export type CustomerFeaturedAndMatchedProductSource = "ATTRIBUTE_MATCH"

type ProductWithRelations = Prisma.ProductGetPayload<{
    include: typeof customerProductInclude.product.include
}>

export type CustomerFeaturedAndMatchedProduct = {
    id: string
    customerId: string
    productId: string
    displayOrder: number
    product: ProductWithRelations
    source: CustomerFeaturedAndMatchedProductSource
    isProfileMatched: true
    matchedAttributeValueIds: string[]
    matchedAttributeLabels: string[]
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
        },
    })

    if (!customer) return []

    const selectedHierarchy = resolveCustomerProfileHierarchy(customer)

    const productWhereClauses = buildCustomerProfileProductWhereClauses(selectedHierarchy)

    if (productWhereClauses.length === 0) {
        return []
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

    return matchedProducts.map((product, index) => {
        const matched = collectMatchedHierarchyValues(product, selectedHierarchy)

        return {
            id: product.id,
            customerId,
            productId: product.id,
            displayOrder: index,
            product,
            source: "ATTRIBUTE_MATCH" as const,
            isProfileMatched: true,
            matchedAttributeValueIds: matched.matchedAttributeValueIds,
            matchedAttributeLabels: matched.matchedAttributeLabels,
        }
    })
}
