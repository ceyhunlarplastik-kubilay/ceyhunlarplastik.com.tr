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

/* -------------------------------------------------------------------------- */
/* TERS YÖN: ürün → müşteri                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Bir ürünün profil ERİŞİM KÜMESİ: "hangi müşteri profili değerleri bu ürünle
 * eşleşir?". Yukarıdaki `buildCustomerProfileProductWhereClauses`'in tam
 * aynasıdır — oradaki her dal burada bir toplama kuralına karşılık gelir.
 *
 * İki yön AYNI kuraldan türemek ZORUNDA: satış temsilcisi "bu müşteriye hangi
 * ürünler" ve "bu ürünü kime satarım" sorularını sorduğunda aynı cevabı
 * görmeli. Ayrışırlarsa hata vermez, yalnız iki ekran birbirini yalanlar.
 * `customerProfileMatching.test.ts` simetriyi kilitler.
 */
export type ProductProfileReach = {
    sectorValueIds: string[]
    productionGroupValueIds: string[]
    usageAreaValueIds: string[]
}

export type ProductIndustrialUsageSource = {
    sectorValueId: string | null
    productionGroupValue: {
        id: string
        parentValueId: string | null
        attribute: { code: string }
    } | null
    usageAreaValue: {
        id: string
        parentValueId: string | null
        attribute: { code: string }
        parentValue: { parentValueId: string | null } | null
    } | null
}

export function collectProductProfileReach(
    usages: ProductIndustrialUsageSource[],
): ProductProfileReach {
    const sectorValueIds = new Set<string>()
    const productionGroupValueIds = new Set<string>()
    const usageAreaValueIds = new Set<string>()

    for (const usage of usages) {
        // Attribute kodu kontrolü ileri yöndeki WHERE dallarının BİREBİR aynısı:
        // orada kontrol edilen dal burada da kontrol edilir, edilmeyen edilmez.
        const typedProductionGroup =
            usage.productionGroupValue?.attribute.code === CUSTOMER_ATTRIBUTE_CODES.productionGroup
                ? usage.productionGroupValue
                : null
        const typedUsageArea =
            usage.usageAreaValue?.attribute.code === CUSTOMER_ATTRIBUTE_CODES.usageArea
                ? usage.usageAreaValue
                : null

        // Sektör seviyesi: doğrudan, üretim grubunun ebeveyni, kullanım alanının dedesi.
        if (usage.sectorValueId) sectorValueIds.add(usage.sectorValueId)
        if (typedProductionGroup?.parentValueId) {
            sectorValueIds.add(typedProductionGroup.parentValueId)
        }
        if (typedUsageArea?.parentValue?.parentValueId) {
            sectorValueIds.add(typedUsageArea.parentValue.parentValueId)
        }

        // Üretim grubu seviyesi: doğrudan, kullanım alanının ebeveyni.
        if (usage.productionGroupValue?.id) {
            productionGroupValueIds.add(usage.productionGroupValue.id)
        }
        if (typedUsageArea?.parentValueId) {
            productionGroupValueIds.add(typedUsageArea.parentValueId)
        }

        // Kullanım alanı seviyesi: doğrudan.
        if (usage.usageAreaValue?.id) usageAreaValueIds.add(usage.usageAreaValue.id)
    }

    return {
        sectorValueIds: Array.from(sectorValueIds),
        productionGroupValueIds: Array.from(productionGroupValueIds),
        usageAreaValueIds: Array.from(usageAreaValueIds),
    }
}

/**
 * Erişim kümesi → müşteri WHERE kuralları. Boş dizi "bu ürünün endüstriyel
 * kullanım tanımı yok, eşleşecek profil yok" demektir.
 *
 * Kolon önceliği `resolveCustomerProfileHierarchy` ile aynı: sektör/üretim grubu
 * kolonu DOLUYSA atama satırına hiç bakılmaz (kolon farklı bir değerse müşteri
 * eşleşmemeli). Kullanım alanı iki kaynağın BİRLEŞİMİ olduğu için orada koşul yok.
 */
export function buildProductProfileCustomerWhereClauses(
    reach: ProductProfileReach,
): Prisma.CustomerWhereInput[] {
    const customerWhereClauses: Prisma.CustomerWhereInput[] = []

    if (reach.sectorValueIds.length > 0) {
        customerWhereClauses.push({
            OR: [
                { sectorValueId: { in: reach.sectorValueIds } },
                {
                    sectorValueId: null,
                    attributeValueAssignments: {
                        some: {
                            attributeValueId: { in: reach.sectorValueIds },
                            attributeValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.sector },
                            },
                        },
                    },
                },
            ],
        })
    }

    if (reach.productionGroupValueIds.length > 0) {
        customerWhereClauses.push({
            OR: [
                { productionGroupValueId: { in: reach.productionGroupValueIds } },
                {
                    productionGroupValueId: null,
                    attributeValueAssignments: {
                        some: {
                            attributeValueId: { in: reach.productionGroupValueIds },
                            attributeValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.productionGroup },
                            },
                        },
                    },
                },
            ],
        })
    }

    if (reach.usageAreaValueIds.length > 0) {
        customerWhereClauses.push({
            OR: [
                { usageAreaValues: { some: { id: { in: reach.usageAreaValueIds } } } },
                {
                    attributeValueAssignments: {
                        some: {
                            attributeValueId: { in: reach.usageAreaValueIds },
                            attributeValue: {
                                attribute: { code: CUSTOMER_ATTRIBUTE_CODES.usageArea },
                            },
                        },
                    },
                },
            ],
        })
    }

    return customerWhereClauses
}

/**
 * Müşterinin profilinden, ürünün erişim kümesiyle KESİŞEN değerleri döndürür —
 * "neden eşleşti?" rozetleri için. Saf: isimler çağıran tarafından verilir.
 */
export function collectMatchedProfileValues(
    hierarchy: CustomerProfileHierarchy,
    reach: ProductProfileReach,
): string[] {
    const matched: string[] = []

    if (hierarchy.sectorValueId && reach.sectorValueIds.includes(hierarchy.sectorValueId)) {
        matched.push(hierarchy.sectorValueId)
    }
    if (
        hierarchy.productionGroupValueId &&
        reach.productionGroupValueIds.includes(hierarchy.productionGroupValueId)
    ) {
        matched.push(hierarchy.productionGroupValueId)
    }
    for (const usageAreaValueId of hierarchy.usageAreaValueIds) {
        if (reach.usageAreaValueIds.includes(usageAreaValueId)) {
            matched.push(usageAreaValueId)
        }
    }

    return Array.from(new Set(matched))
}
