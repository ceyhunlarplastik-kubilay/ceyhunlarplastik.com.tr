import { prisma } from "@/core/db/prisma"
import {
    buildProductProfileCustomerWhereClauses,
    collectMatchedProfileValues,
    collectProductProfileReach,
    resolveCustomerProfileHierarchy,
    type ProductProfileReach,
} from "@/core/helpers/crm/customerProfileMatching"
import { buildCustomerAddressSummary } from "@/core/helpers/crm/customerAddressSummary"
import { GOOGLE_PLACES_PROVIDER } from "@/core/helpers/crm/customerAddressInput"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import type { Prisma } from "@/prisma/generated/prisma/client"
import type { CustomerStatus } from "@/prisma/generated/prisma/enums"

/**
 * ÜRÜN → MÜŞTERİ eşleşmesi. Müşteri portalındaki "İlgili Ürünler"in tersi:
 * satış temsilcisi elindeki ürün modeli için hangi müşteri/potansiyel müşteriye
 * gidebileceğini görür.
 *
 * Kural `customerProfileMatching.ts`'te tek yerde durur; bu modül yalnız Prisma
 * okumasını ve DAR satır şeklini üstlenir. `getCustomerFeaturedAndMatchedProducts`
 * ürün başına üç seviyeli taksonomi ağacı taşıyor — bu ekranda o ağırlık
 * gereksiz (ve client'a inen payload'ı şişirir).
 */

export const PRODUCT_MATCHED_CUSTOMER_SORT_FIELDS = [
    "companyName",
    "fullName",
    "createdAt",
    "status",
] as const

export type ProductMatchedCustomerSortField = (typeof PRODUCT_MATCHED_CUSTOMER_SORT_FIELDS)[number]

export type ProductProfileReachLabel = {
    id: string
    name: string
}

/**
 * Haritanın ihtiyaç duyduğu adres. Koordinat Google Places'ten geldiyse ve
 * önbellek süresi dolduysa NULL döner (`mapCustomerForApi` ile aynı kural):
 * Google koordinatlarını süresiz saklamak sağlayıcı şartlarına aykırı.
 */
export type ProductMatchedCustomerAddress = {
    id: string
    label: string
    summary: string
    latitude: number | null
    longitude: number | null
    isPrimary: boolean
    isShipping: boolean
}

export type ProductMatchedCustomerRow = {
    id: string
    companyName: string | null
    fullName: string | null
    email: string
    phone: string
    status: CustomerStatus
    createdAt: Date
    sectorName: string | null
    productionGroupName: string | null
    assignedSalesUserName: string | null
    /** Listede gösterilen kısa coğrafya (il / ilçe). */
    locationSummary: string | null
    /** Harita görünümü için tam adres + koordinat. */
    address: ProductMatchedCustomerAddress | null
    /** "Neden eşleşti?" rozetleri: müşteri profilinin ürünle kesişen değerleri. */
    matchedLabels: string[]
}

export type ProductMatchedCustomersResult = {
    data: ProductMatchedCustomerRow[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    /**
     * Sekme sayaçları: durum filtresi HARİÇ diğer tüm filtreler uygulanmış hâl.
     * Sunucudan gelir çünkü liste sayfalanıyor — sayfadaki satırlardan sayılamaz.
     */
    counts: {
        all: number
        lead: number
        customer: number
    }
    /** Ürünün erişim kümesinin okunabilir hâli — boş sonuçta neden boş olduğunu anlatır. */
    reach: {
        sectors: ProductProfileReachLabel[]
        productionGroups: ProductProfileReachLabel[]
        usageAreas: ProductProfileReachLabel[]
    }
}

const EMPTY_REACH_LABELS: ProductMatchedCustomersResult["reach"] = {
    sectors: [],
    productionGroups: [],
    usageAreas: [],
}

const EMPTY_COUNTS: ProductMatchedCustomersResult["counts"] = { all: 0, lead: 0, customer: 0 }

/**
 * Adres filtresi normalize FK'lar üzerinden çalışır (görüntü metinleri değil) —
 * indeksli ve metnin nasıl yazıldığından bağımsız. `leadCustomers.ts`'teki
 * `buildAddressWhere` ile aynı kural.
 */
function buildAddressFilter(filter: {
    countryId?: number
    stateId?: number
    cityId?: number
}): Prisma.CustomerAddressWhereInput | null {
    const address: Prisma.CustomerAddressWhereInput = {
        ...(filter.countryId ? { countryId: filter.countryId } : {}),
        ...(filter.stateId ? { stateId: filter.stateId } : {}),
        ...(filter.cityId ? { cityId: filter.cityId } : {}),
    }

    return Object.keys(address).length > 0 ? address : null
}

/**
 * Birden çok ürün kabul eder: erişim kümeleri BİRLEŞTİRİLİR ("bu ürünlerden
 * herhangi biriyle eşleşen müşteriler"). Uç bugün tek ürünle çağırıyor; çoklu
 * seçim geldiğinde çekirdek değişmez.
 */
export async function loadProductProfileReach(productIds: string[]): Promise<ProductProfileReach> {
    if (productIds.length === 0) {
        return { sectorValueIds: [], productionGroupValueIds: [], usageAreaValueIds: [] }
    }

    const usages = await prisma.productIndustrialUsage.findMany({
        where: { productId: { in: productIds } },
        select: {
            sectorValueId: true,
            productionGroupValue: {
                select: {
                    id: true,
                    parentValueId: true,
                    attribute: { select: { code: true } },
                },
            },
            usageAreaValue: {
                select: {
                    id: true,
                    parentValueId: true,
                    attribute: { select: { code: true } },
                    parentValue: { select: { parentValueId: true } },
                },
            },
        },
    })

    return collectProductProfileReach(usages)
}

async function loadReachLabels(reach: ProductProfileReach) {
    const allIds = [
        ...reach.sectorValueIds,
        ...reach.productionGroupValueIds,
        ...reach.usageAreaValueIds,
    ]

    if (allIds.length === 0) return EMPTY_REACH_LABELS

    const values = await prisma.productAttributeValue.findMany({
        where: { id: { in: allIds } },
        select: { id: true, name: true },
        orderBy: { displayOrder: "asc" },
    })

    const nameById = new Map(values.map((value) => [value.id, value.name]))
    const toLabels = (ids: string[]) =>
        ids
            .filter((id) => nameById.has(id))
            .map((id) => ({ id, name: nameById.get(id) as string }))

    return {
        sectors: toLabels(reach.sectorValueIds),
        productionGroups: toLabels(reach.productionGroupValueIds),
        usageAreas: toLabels(reach.usageAreaValueIds),
    }
}

export async function listProductMatchedCustomers(input: {
    productIds: string[]
    page: number
    limit: number
    search?: string
    status?: CustomerStatus
    /** Adres filtresi — ülke / il / ilçe (normalize FK). */
    countryId?: number
    stateId?: number
    cityId?: number
    /** Yönetici rollerinin açık temsilci filtresi. */
    assignedSalesUserId?: string
    /**
     * Satış temsilcisinin kapsamı: KENDİ müşterileri + HENÜZ ATANMAMIŞ kayıtlar.
     *
     * Neden atanmamışlar da dahil: potansiyel müşteriler veri girişi panelinden
     * temsilcisiz olarak giriliyor. Katı "yalnız kendi portföyü" kuralı bu ekranın
     * LEAD tarafını tamamen boşaltırdı — oysa amaç tam da temsilcinin sahipsiz
     * potansiyeli görüp o ürünle temasa geçmesi. Başkasının müşterisi yine görünmez.
     */
    salesScopeUserId?: string
    sort?: ProductMatchedCustomerSortField
    order?: "asc" | "desc"
}): Promise<ProductMatchedCustomersResult> {
    const { page, limit } = input
    const emptyMeta = { page, limit, total: 0, totalPages: 0 }

    const reach = await loadProductProfileReach(input.productIds)
    const matchClauses = buildProductProfileCustomerWhereClauses(reach)

    if (matchClauses.length === 0) {
        return { data: [], meta: emptyMeta, counts: EMPTY_COUNTS, reach: EMPTY_REACH_LABELS }
    }

    const filters: Prisma.CustomerWhereInput[] = [{ OR: matchClauses }]

    if (input.search) {
        filters.push({
            OR: [
                { companyName: { contains: input.search, mode: "insensitive" } },
                { fullName: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
                { phone: { contains: input.search, mode: "insensitive" } },
            ],
        })
    }
    if (input.assignedSalesUserId) filters.push({ assignedSalesUserId: input.assignedSalesUserId })
    if (input.salesScopeUserId) {
        filters.push({
            OR: [
                { assignedSalesUserId: input.salesScopeUserId },
                { assignedSalesUserId: null },
            ],
        })
    }

    const addressFilter = buildAddressFilter(input)
    if (addressFilter) filters.push({ addresses: { some: addressFilter } })

    // Durum filtresi AYRI tutulur: sekme sayaçları "durum hariç her filtre
    // uygulanmış" hâli sayar, yoksa aktif sekme dışındaki sayaçlar 0 görünürdü.
    const whereWithoutStatus: Prisma.CustomerWhereInput = { AND: filters }
    const where: Prisma.CustomerWhereInput = input.status
        ? { AND: [...filters, { status: input.status }] }
        : whereWithoutStatus

    const [total, customers, statusGroups, reachLabels] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
            where,
            orderBy: { [input.sort ?? "companyName"]: input.order ?? "asc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                companyName: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                sectorValueId: true,
                productionGroupValueId: true,
                sectorValue: { select: { id: true, name: true } },
                productionGroupValue: { select: { id: true, name: true } },
                usageAreaValues: { select: { id: true, name: true } },
                attributeValueAssignments: {
                    select: {
                        attributeValueId: true,
                        attributeValue: {
                            select: {
                                name: true,
                                attribute: { select: { code: true } },
                            },
                        },
                    },
                },
                assignedSalesUser: { select: { firstName: true, lastName: true } },
                addresses: {
                    // Geo filtresi varsa gösterilen adres de o filtreye uyan olmalı;
                    // aksi hâlde "Bursa" filtresinde İstanbul adresi yazardı.
                    ...(addressFilter ? { where: addressFilter } : {}),
                    orderBy: [
                        { isPrimary: "desc" },
                        { isShipping: "desc" },
                        { displayOrder: "asc" },
                        { createdAt: "asc" },
                    ],
                    take: 1,
                    select: {
                        id: true,
                        label: true,
                        line1: true,
                        district: true,
                        city: true,
                        country: true,
                        latitude: true,
                        longitude: true,
                        isPrimary: true,
                        isShipping: true,
                        geocodingProvider: true,
                        geocodingExpiresAt: true,
                    },
                },
            },
        }),
        prisma.customer.groupBy({
            by: ["status"],
            where: whereWithoutStatus,
            _count: { _all: true },
        }),
        loadReachLabels(reach),
    ])

    const countByStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]))
    const counts = {
        lead: countByStatus.get("LEAD") ?? 0,
        customer: countByStatus.get("CUSTOMER") ?? 0,
        all: 0,
    }
    counts.all = counts.lead + counts.customer

    const data = customers.map((customer) => {
        const hierarchy = resolveCustomerProfileHierarchy(customer)
        const matchedValueIds = collectMatchedProfileValues(hierarchy, reach)

        const nameById = new Map<string, string>()
        if (customer.sectorValue) nameById.set(customer.sectorValue.id, customer.sectorValue.name)
        if (customer.productionGroupValue) {
            nameById.set(customer.productionGroupValue.id, customer.productionGroupValue.name)
        }
        for (const value of customer.usageAreaValues) nameById.set(value.id, value.name)
        for (const assignment of customer.attributeValueAssignments) {
            nameById.set(assignment.attributeValueId, assignment.attributeValue.name)
        }

        const address = customer.addresses[0]
        const locationParts = [address?.city, address?.district].filter(Boolean)
        const salesUser = customer.assignedSalesUser

        // Google Places koordinatını süresiz saklamak sağlayıcı şartlarına aykırı;
        // süresi dolmuşsa koordinat düşer, adres metni kalır (mapCustomerForApi'yle aynı).
        const googleCoordinatesExpired =
            address?.geocodingProvider === GOOGLE_PLACES_PROVIDER &&
            Boolean(address.geocodingExpiresAt) &&
            (address.geocodingExpiresAt as Date).getTime() <= Date.now()

        return {
            id: customer.id,
            companyName: customer.companyName,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            status: customer.status,
            createdAt: customer.createdAt,
            sectorName: customer.sectorValue?.name ?? null,
            productionGroupName: customer.productionGroupValue?.name ?? null,
            assignedSalesUserName: salesUser
                ? `${salesUser.firstName ?? ""} ${salesUser.lastName ?? ""}`.trim() || null
                : null,
            locationSummary: locationParts.length > 0 ? locationParts.join(" / ") : null,
            address: address
                ? {
                    id: address.id,
                    label: address.label,
                    summary: buildCustomerAddressSummary(address),
                    latitude: googleCoordinatesExpired ? null : decimalLikeToNumber(address.latitude) ?? null,
                    longitude: googleCoordinatesExpired ? null : decimalLikeToNumber(address.longitude) ?? null,
                    isPrimary: address.isPrimary,
                    isShipping: address.isShipping,
                }
                : null,
            matchedLabels: matchedValueIds
                .map((id) => nameById.get(id))
                .filter((name): name is string => Boolean(name)),
        }
    })

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        counts,
        reach: reachLabels,
    }
}
