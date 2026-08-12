import { CUSTOMER_ATTRIBUTE_CODES } from "@/core/helpers/crm/customerAttributes"
import type { Prisma } from "@/prisma/generated/prisma/client"

/**
 * Müşteri profili → ürün eşleşmesinin SAF kuralları — I/O yok, bu yüzden birim
 * testlenebilir. Prisma'ya dokunan yüzey
 * `getCustomerFeaturedAndMatchedProducts.ts` içinde ve bu modülü kullanır.
 *
 * İki tüketici var ve ikisi de aynı kuralı paylaşmak ZORUNDA: müşteri
 * portalındaki "İlgili Ürünler" ve veri girişi panelindeki potansiyel müşteri
 * eşleşme önizlemesi. Kural burada tek yerde durur.
 */

export type CustomerProfileHierarchy = {
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueIds: string[]
}

type CustomerProfileSource = {
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValues: Array<{ id: string }>
    attributeValueAssignments: Array<{
        attributeValueId: string
        attributeValue: { attribute: { code: string } }
    }>
}

/**
 * Müşterinin profil hiyerarşisi İKİ yerde yaşıyor: kaydın kendi FK'leri ve
 * `CustomerAttributeValueAssignment` satırları. Kolonlar önceliklidir, atama
 * satırları yalnız kolon boşsa devreye girer.
 *
 * Dışa açık: eşleşme kuralı tek yerde kalsın diye potansiyel müşteri önizlemesi
 * de bunu kullanır — kural kopyalanmaz.
 */
export function resolveCustomerProfileHierarchy(
    customer: CustomerProfileSource,
): CustomerProfileHierarchy {
    const assignedSectorValueId = customer.attributeValueAssignments.find(
        (assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.sector,
    )?.attributeValueId ?? null

    const assignedProductionGroupValueId = customer.attributeValueAssignments.find(
        (assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.productionGroup,
    )?.attributeValueId ?? null

    const assignedUsageAreaValueIds = customer.attributeValueAssignments
        .filter((assignment) => assignment.attributeValue.attribute.code === CUSTOMER_ATTRIBUTE_CODES.usageArea)
        .map((assignment) => assignment.attributeValueId)

    return {
        sectorValueId: customer.sectorValueId ?? assignedSectorValueId,
        productionGroupValueId: customer.productionGroupValueId ?? assignedProductionGroupValueId,
        usageAreaValueIds: Array.from(new Set([
            ...customer.usageAreaValues.map((value) => value.id),
            ...assignedUsageAreaValueIds,
        ])),
    }
}

/**
 * Profil → ürün eşleşmesinin WHERE kuralları. Boş dizi "aranacak profil yok"
 * demektir.
 *
 * Dışa açık: ağır `customerProductInclude` olmadan yalnız sayı/önizleme almak
 * isteyen çağıranlar aynı kuralı ince bir `select` ile kullanabilsin.
 */
export function buildCustomerProfileProductWhereClauses(
    hierarchy: CustomerProfileHierarchy,
): Prisma.ProductWhereInput[] {
    const productWhereClauses: Prisma.ProductWhereInput[] = []

    if (hierarchy.sectorValueId) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    OR: [
                        {
                            sectorValueId: hierarchy.sectorValueId,
                        },
                        {
                            productionGroupValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.productionGroup },
                                parentValueId: hierarchy.sectorValueId,
                            },
                        },
                        {
                            usageAreaValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.usageArea },
                                parentValue: {
                                    parentValueId: hierarchy.sectorValueId,
                                },
                            },
                        },
                    ],
                },
            },
        })
    }

    if (hierarchy.productionGroupValueId) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    OR: [
                        {
                            productionGroupValueId: hierarchy.productionGroupValueId,
                        },
                        {
                            usageAreaValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.usageArea },
                                parentValueId: hierarchy.productionGroupValueId,
                            },
                        },
                    ],
                },
            },
        })
    }

    if (hierarchy.usageAreaValueIds.length > 0) {
        productWhereClauses.push({
            industrialUsages: {
                some: {
                    usageAreaValueId: {
                        in: hierarchy.usageAreaValueIds,
                    },
                },
            },
        })
    }
    return productWhereClauses
}
