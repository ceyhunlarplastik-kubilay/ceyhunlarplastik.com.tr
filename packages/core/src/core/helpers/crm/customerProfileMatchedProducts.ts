import { prisma } from "@/core/db/prisma"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import {
    buildCustomerProfileProductWhereClauses,
    resolveCustomerProfileHierarchy,
} from "@/core/helpers/crm/customerProfileMatching"
import { AssetRole, Prisma } from "@/prisma/generated/prisma/client"

/**
 * Bir müşterinin endüstriyel profiliyle EŞLEŞEN ürünlerin önizlemesi.
 *
 * Eşleşme kuralları `buildCustomerProfileProductWhereClauses` ile ortaktır
 * (müşteri portalındaki "İlgili Ürünler" ile aynı kaynak). `select` bilinçli
 * olarak incedir: `getCustomerFeaturedAndMatchedProducts` ürün başına 3 seviyeli
 * taksonomi zinciri taşır, bu önizleme yüzeyleri (veri girişi paneli, satış
 * paneli müşteri accordion'u) için o ağırlık gereksiz (ve 6MB sınıfı risk).
 *
 * STATÜ-AGNOSTİK: potansiyel (LEAD) ve cari (CUSTOMER) müşteri ayırt etmez —
 * yalnız `customerId` üzerinden profil okur. Erişim kontrolü çağıranın işidir.
 */

/** Önizlemede gösterilecek en fazla ürün. Sayının tamamı ayrıca döner. */
export const CUSTOMER_PROFILE_MATCH_PREVIEW_LIMIT = 12

export type CustomerProfileMatchedProduct = {
    id: string
    code: string
    name: string
    slug: string
    categoryName: string | null
    primaryImageUrl: string | null
    matchedLabels: string[]
}

export type CustomerProfileMatchedProductsResult = {
    /** En az bir sektör / üretim grubu / kullanım alanı atanmış mı. */
    hasProfile: boolean
    matchedProductCount: number
    matchedProducts: CustomerProfileMatchedProduct[]
}

export async function getCustomerProfileMatchedProducts(
    customerId: string,
): Promise<CustomerProfileMatchedProductsResult> {
    const profile = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            sectorValueId: true,
            productionGroupValueId: true,
            usageAreaValues: { select: { id: true } },
            attributeValueAssignments: {
                select: {
                    attributeValueId: true,
                    attributeValue: {
                        select: { attribute: { select: { code: true } } },
                    },
                },
            },
        },
    })

    if (!profile) return { hasProfile: false, matchedProductCount: 0, matchedProducts: [] }

    const hierarchy = resolveCustomerProfileHierarchy(profile)
    const hasProfile = Boolean(
        hierarchy.sectorValueId || hierarchy.productionGroupValueId || hierarchy.usageAreaValueIds.length,
    )
    const whereClauses = buildCustomerProfileProductWhereClauses(hierarchy)

    if (whereClauses.length === 0) {
        return { hasProfile, matchedProductCount: 0, matchedProducts: [] }
    }

    const where: Prisma.ProductWhereInput = { OR: whereClauses }

    const [matchedProductCount, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy: { code: "asc" },
            take: CUSTOMER_PROFILE_MATCH_PREVIEW_LIMIT,
            select: {
                id: true,
                code: true,
                name: true,
                slug: true,
                category: { select: { name: true } },
                assets: { select: { key: true, role: true, type: true } },
                industrialUsages: {
                    where: {
                        usageAreaValueId: { in: hierarchy.usageAreaValueIds },
                    },
                    select: {
                        usageAreaValue: { select: { name: true } },
                    },
                    take: 5,
                },
            },
        }),
    ])

    const matchedProducts: CustomerProfileMatchedProduct[] = products.map((product) => {
        const primaryAsset =
            product.assets.find((asset) => asset.role === AssetRole.PRIMARY && asset.type === "IMAGE") ??
            product.assets.find((asset) => asset.type === "IMAGE")

        const matchedLabels = Array.from(
            new Set(
                product.industrialUsages
                    .map((usage) => usage.usageAreaValue?.name)
                    .filter((name): name is string => Boolean(name)),
            ),
        )

        return {
            id: product.id,
            code: product.code,
            name: product.name,
            slug: product.slug,
            categoryName: product.category?.name ?? null,
            primaryImageUrl: primaryAsset ? buildAssetUrl(primaryAsset.key) : null,
            matchedLabels,
        }
    })

    return { hasProfile, matchedProductCount, matchedProducts }
}
