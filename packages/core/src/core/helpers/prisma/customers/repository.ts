import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { normalizeCompanyContactAssignments } from "@/core/helpers/crm/companyContactAssignments"
import { GOOGLE_PLACES_PROVIDER } from "@/core/helpers/crm/customerAddressInput"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import { buildCustomerAddressSummary } from "@/core/helpers/crm/customerAddressSummary"
import {
    CustomerAddressLocationAccuracy,
    CustomerAddressLocationSource,
    CustomerStatus,
    CustomerVisitStatus,
} from "@/prisma/generated/prisma/enums"
import { Customer, CustomerAssignedProductSource, Prisma } from "@/prisma/generated/prisma/client"
import { productVariantStructureIncludeBasic } from "@/core/helpers/prisma/productVariants/repository"

const customerUserSummarySelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    groups: true,
    imageKey: true,
    phone: true,
    customerContactTitle: true,
    customerContactDepartment: true,
    isPrimaryCustomerContact: true,
    customerInvitations: {
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
        ],
        take: 1,
        select: {
            acceptedAt: true,
            expiresAt: true,
            requestedFirstName: true,
            requestedLastName: true,
            requestedCustomerContactTitle: true,
            requestedCustomerContactDepartment: true,
            requestedIsPrimaryCustomerContact: true,
        },
    },
} as any

const customerBaseInclude = {
    sectorValue: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    productionGroupValue: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    usageAreaValues: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    attributeValueAssignments: {
        include: {
            attributeValue: {
                include: {
                    attribute: true,
                    assets: true,
                    parentValue: {
                        include: {
                            attribute: true,
                            assets: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                    assets: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            {
                createdAt: "asc",
            },
        ],
    },
    assignedSalesUser: {
        select: customerUserSummarySelect,
    },
    convertedByUser: {
        select: customerUserSummarySelect,
    },
    companyContactAssignments: {
        orderBy: [
            { displayOrder: "asc" },
            { createdAt: "asc" },
        ],
        include: {
            companyContact: true,
        },
    },
} satisfies Prisma.CustomerInclude

// Neon gibi uzak PostgreSQL bağlantılarında art arda gelen adres yazmaları,
// Prisma'nın interaktif transaction için varsayılan 5 saniyelik süresini
// zaman zaman aşabiliyor. Transaction içinde yalnız atomik olması gereken
// yazmaları tutuyor, yine de ağ dalgalanmaları için sınırlı bir pay bırakıyoruz.
const addressTransactionOptions = {
    maxWait: 5_000,
    timeout: 15_000,
} as const

/** Harita tek görünümde sınırsız pin çizmez; yakınlaşma zaten daraltır. */
const MAP_CUSTOMER_LIMIT = 500

export const customerProductInclude = {
    createdByUser: {
        select: customerUserSummarySelect,
    },
    product: {
        include: {
            category: true,
            assets: true,
            attributeValues: {
                include: {
                    attribute: true,
                    parentValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                },
                            },
                        },
                    },
                },
            },
            industrialUsages: {
                orderBy: {
                    displayOrder: "asc",
                },
                include: {
                    sectorValue: {
                        include: {
                            attribute: true,
                        },
                    },
                    productionGroupValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                },
                            },
                        },
                    },
                    usageAreaValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                    parentValue: {
                                        include: {
                                            attribute: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.CustomerFeaturedProductInclude

export const customerAssignedProductVariantInclude = {
    createdByUser: {
        select: customerUserSummarySelect,
    },
    productVariant: {
        include: {
            product: customerProductInclude.product,
            ...productVariantStructureIncludeBasic,
            assets: true,
        },
    },
} satisfies Prisma.CustomerAssignedProductInclude

const customerDetailInclude = {
    ...customerBaseInclude,
    featuredProducts: {
        orderBy: {
            displayOrder: "asc",
        },
        include: customerProductInclude,
    },
    assignedProducts: {
        orderBy: {
            displayOrder: "asc",
        },
        include: customerAssignedProductVariantInclude,
    },
    portalUsers: {
        orderBy: [
            { isPrimaryCustomerContact: "desc" },
            { createdAt: "asc" },
        ],
        select: customerUserSummarySelect,
    },
    addresses: {
        orderBy: [
            { isPrimary: "desc" },
            { displayOrder: "asc" },
            { createdAt: "asc" },
        ],
        include: {
            countryRef: {
                select: {
                    id: true,
                    name: true,
                    iso2: true,
                },
            },
            stateRef: {
                select: {
                    id: true,
                    name: true,
                },
            },
            cityRef: {
                select: {
                    id: true,
                    name: true,
                },
            },
            locationVerifiedByUser: {
                select: customerUserSummarySelect,
            },
        },
    },
    visits: {
        orderBy: [
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
        include: {
            ownerUser: {
                select: customerUserSummarySelect,
            },
            createdByUser: {
                select: customerUserSummarySelect,
            },
        },
    },
} satisfies Prisma.CustomerInclude

// Panel ilk-yük pattern'i: portal overview sayfası ürünleri RENDER ETMEZ, yalnız
// sayaçlarını gösterir. customerDetailInclude'un en ağır kısmı olan
// featuredProducts/assignedProducts ürün ağaçları (ürün başına ~175KB sınıfı)
// burada _count'a indirilir; profil/iletişim/adres/kullanım-alanı blokları kalır.
const customerPortalOverviewInclude = {
    ...customerBaseInclude,
    portalUsers: customerDetailInclude.portalUsers,
    addresses: customerDetailInclude.addresses,
    _count: {
        select: {
            featuredProducts: true,
            assignedProducts: true,
        },
    },
} satisfies Prisma.CustomerInclude

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
    include: typeof customerBaseInclude
}>

export type CustomerPortalOverview = Prisma.CustomerGetPayload<{
    include: typeof customerPortalOverviewInclude
}>

export type CustomerDetail = Prisma.CustomerGetPayload<{
    include: typeof customerDetailInclude
}>

export type CustomerAttributeValueAssignmentWithRelations = Prisma.CustomerAttributeValueAssignmentGetPayload<{
    include: typeof customerBaseInclude.attributeValueAssignments.include
}>

export type CustomerFeaturedProductWithRelations = Prisma.CustomerFeaturedProductGetPayload<{
    include: typeof customerProductInclude
}>

export type CustomerAssignedProductWithRelations = Prisma.CustomerAssignedProductGetPayload<{
    include: typeof customerAssignedProductVariantInclude
}>

export type CustomerAddressRecord = Prisma.CustomerAddressGetPayload<{
    include: typeof customerDetailInclude.addresses.include
}>

export type CustomerVisitWithRelations = Prisma.CustomerVisitGetPayload<{
    include: typeof customerDetailInclude.visits.include
}>

export type CustomerAddressMutationInput = {
    label: string
    contactName?: string | null
    phone?: string | null
    email?: string | null
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    country?: string | null
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    taxOffice?: string | null
    taxNumber?: string | null
    latitude?: number | null
    longitude?: number | null
    locationSource?: CustomerAddressLocationSource | null
    locationAccuracy?: CustomerAddressLocationAccuracy | null
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
    geocodingLabel?: string | null
    geocodingRaw?: Prisma.InputJsonValue | null
    geocodedAt?: Date | null
    geocodingExpiresAt?: Date | null
    locationVerifiedAt?: Date | null
    locationVerifiedByUserId?: string | null
    isPrimary?: boolean
    isBilling?: boolean
    isShipping?: boolean
    note?: string | null
}

export type CustomerMapPointRecord = {
    customerId: string
    companyName?: string | null
    fullName: string | null
    email: string
    phone: string
    status: CustomerStatus
    assignedSalesUserId?: string | null
    addressId: string
    addressLabel: string
    addressSummary: string
    latitude: number
    longitude: number
    isPrimary: boolean
    isShipping: boolean
    /**
     * Adres Google Places'ten geldiyse ("google_places") harita popup'ında native
     * Google işletme kartı gösterilir; aksi halde CRM'deki adres metni.
     */
    geocodingProvider: string | null
    geocodingPlaceId: string | null
}

export interface IPrismaCustomerRepository {
    listCustomers(
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
            status?: CustomerStatus
            assignedSalesUserId?: string
        }
    ): Promise<{
        data: CustomerWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getCustomer(id: string): Promise<CustomerDetail | null>
    /**
     * P2.8(a): Yalnız fiyat bağlamı için DAR sorgu. `getCustomer` müşteri detayının
     * tüm relation'larını çeker; portal fiyat hesabı için tek alan yeterli.
     */
    getCustomerPricingContext(id: string): Promise<{ generalDiscountPercent: Prisma.Decimal | null } | null>
    /**
     * Portal overview: ürün ağaçları yerine _count taşıyan hafif müşteri profili
     * (panel ilk-yük pattern'i — sayfa ürünleri render etmez, yalnız sayar).
     */
    getCustomerPortalOverview(id: string): Promise<CustomerPortalOverview | null>
    createCustomer(data: Prisma.CustomerCreateInput): Promise<CustomerWithRelations>
    updateCustomer(id: string, data: Prisma.CustomerUpdateInput): Promise<CustomerWithRelations>
    createAddress(
        customerId: string,
        data: CustomerAddressMutationInput,
    ): Promise<CustomerDetail>
    getAddress(customerId: string, addressId: string): Promise<CustomerAddressRecord | null>
    updateAddress(customerId: string, addressId: string, data: CustomerAddressMutationInput): Promise<CustomerDetail>
    deleteAddress(customerId: string, addressId: string): Promise<CustomerDetail>
    listCustomersForMap(query: {
        north: number
        south: number
        east: number
        west: number
        search?: string
        status?: CustomerStatus
        assignedSalesUserId?: string
        sectorValueId?: string
        usageAreaValueId?: string
        countryId?: number
        stateId?: number
        cityId?: number
    }): Promise<CustomerMapPointRecord[]>
    replaceCompanyContactAssignments(
        customerId: string,
        assignments: Array<{
            companyContactId: string
            isActive?: boolean
            displayOrder?: number
            note?: string | null
        }>,
    ): Promise<CustomerWithRelations>
    convertCustomer(id: string, convertedByUserId: string): Promise<CustomerWithRelations>
    replaceFeaturedProducts(
        customerId: string,
        productIds: string[],
        createdByUserId: string,
    ): Promise<CustomerFeaturedProductWithRelations[]>
    listFeaturedProducts(customerId: string): Promise<CustomerFeaturedProductWithRelations[]>
    replaceAssignedProducts(
        customerId: string,
        productVariantIds: string[],
        createdByUserId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    listAssignedProducts(customerId: string): Promise<CustomerAssignedProductWithRelations[]>
    addCustomerFavoriteVariant(
        customerId: string,
        productVariantId: string,
        createdByUserId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    removeCustomerFavoriteVariant(
        customerId: string,
        productVariantId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    listVisits(customerId: string): Promise<CustomerVisitWithRelations[]>
    createVisit(data: Prisma.CustomerVisitCreateInput): Promise<CustomerVisitWithRelations>
    updateVisit(id: string, data: Prisma.CustomerVisitUpdateInput): Promise<CustomerVisitWithRelations>
    deleteVisit(id: string): Promise<CustomerVisitWithRelations>
}

export const customerRepository = (): IPrismaCustomerRepository => {
    const buildAddressWriteData = (
        data: CustomerAddressMutationInput,
        mode: "create" | "update",
    ): Prisma.CustomerAddressUncheckedCreateWithoutCustomerInput | Prisma.CustomerAddressUncheckedUpdateInput => {
        const base = {
            label: data.label,
            contactName: data.contactName ?? null,
            phone: data.phone ?? null,
            email: data.email ?? null,
            countryId: data.countryId ?? null,
            stateId: data.stateId ?? null,
            cityId: data.cityId ?? null,
            country: data.country?.trim() || "Turkiye",
            city: data.city,
            district: data.district ?? null,
            line1: data.line1,
            line2: data.line2 ?? null,
            postalCode: data.postalCode ?? null,
            taxOffice: data.taxOffice ?? null,
            taxNumber: data.taxNumber ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            locationSource: data.locationSource ?? null,
            locationAccuracy: data.locationAccuracy ?? null,
            geocodingProvider: data.geocodingProvider ?? null,
            geocodingPlaceId: data.geocodingPlaceId ?? null,
            geocodingLabel: data.geocodingLabel ?? null,
            geocodedAt: data.geocodedAt ?? null,
            geocodingExpiresAt: data.geocodingExpiresAt ?? null,
            locationVerifiedAt: data.locationVerifiedAt ?? null,
            locationVerifiedByUserId: data.locationVerifiedByUserId ?? null,
            isPrimary: Boolean(data.isPrimary),
            isBilling: Boolean(data.isBilling),
            isShipping: data.isShipping ?? true,
            note: data.note ?? null,
        }

        if (mode === "create") {
            return {
                ...base,
                geocodingRaw: data.geocodingRaw ?? Prisma.DbNull,
            }
        }

        return Object.fromEntries(
            Object.entries({
                ...base,
                geocodingRaw: data.geocodingRaw === undefined ? undefined : data.geocodingRaw ?? Prisma.DbNull,
                locationVerifiedByUserId: data.locationVerifiedByUserId === undefined ? undefined : data.locationVerifiedByUserId,
            }).filter(([, value]) => value !== undefined),
        ) as Prisma.CustomerAddressUncheckedUpdateInput
    }

    const sortAddressesForDisplay = <T extends {
        displayOrder: number
        createdAt: Date
    }>(addresses: T[]) => [...addresses].sort((left, right) =>
        left.displayOrder - right.displayOrder || left.createdAt.getTime() - right.createdAt.getTime(),
    )

    const normalizeAddressOrderingAndFlags = <T extends {
        id: string
        isPrimary: boolean
        isShipping: boolean
        displayOrder: number
        createdAt: Date
    }>(addresses: T[]) => {
        const sorted = sortAddressesForDisplay(addresses)
        const hasPrimary = sorted.some((address) => address.isPrimary)
        const hasShipping = sorted.some((address) => address.isShipping)
        const fallbackAddressId = (sorted.find((address) => address.isShipping) ?? sorted[0])?.id ?? null

        return sorted.map((address, index) => ({
            id: address.id,
            displayOrder: index,
            isPrimary: hasPrimary ? address.isPrimary : address.id === fallbackAddressId,
            isShipping: hasShipping ? address.isShipping : address.id === fallbackAddressId,
        }))
    }

    const listCustomers = async (
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
            status?: CustomerStatus
            assignedSalesUserId?: string
        },
    ) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<Customer>(query, {
            searchableFields: ["fullName", "companyName", "email", "phone"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.CustomerWhereInput = {
            ...where,
            ...(query.status ? { status: query.status } : {}),
            ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
            ...(query.sectorValueId ? { sectorValueId: query.sectorValueId } : {}),
            ...(query.productionGroupValueId
                ? { productionGroupValueId: query.productionGroupValueId }
                : {}),
            ...(query.usageAreaValueId
                ? {
                    usageAreaValues: {
                        some: {
                            id: query.usageAreaValueId,
                        },
                    },
                }
                : {}),
        }

        const data = await prisma.customer.findMany({
            where: finalWhere,
            orderBy,
            skip,
            take,
            include: customerBaseInclude,
        })
        const total = await prisma.customer.count({ where: finalWhere })

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listCustomersForMap = async (query: {
        north: number
        south: number
        east: number
        west: number
        search?: string
        status?: CustomerStatus
        assignedSalesUserId?: string
        sectorValueId?: string
        usageAreaValueId?: string
        countryId?: number
        stateId?: number
        cityId?: number
    }) => {
        const south = Math.min(query.south, query.north)
        const north = Math.max(query.south, query.north)
        const west = Math.min(query.west, query.east)
        const east = Math.max(query.west, query.east)
        // Adres FK filtresi (ülke/il/ilçe): normalize FK'lar üzerinden, görüntü
        // metinleri değil — indeksli ve metnin yazımından bağımsız. Pinlenecek
        // adres hem viewport'a hem bu filtreye uymalı, o yüzden `coordinateWhere`
        // ile AND'lenir.
        const geoAddressWhere: Prisma.CustomerAddressWhereInput = {
            ...(query.countryId ? { countryId: query.countryId } : {}),
            ...(query.stateId ? { stateId: query.stateId } : {}),
            ...(query.cityId ? { cityId: query.cityId } : {}),
        }
        // Görünür pencere SQL'de daraltılır: aksi halde her pan/zoom koordinatlı
        // TÜM müşterileri ve adreslerini çekip JS'te eler.
        const coordinateWhere: Prisma.CustomerAddressWhereInput = {
            ...geoAddressWhere,
            latitude: { not: null, gte: south, lte: north },
            longitude: { not: null, gte: west, lte: east },
            OR: [
                { geocodingProvider: null },
                { geocodingProvider: { not: GOOGLE_PLACES_PROVIDER } },
                {
                    geocodingProvider: GOOGLE_PLACES_PROVIDER,
                    geocodingExpiresAt: { gt: new Date() },
                },
            ],
        }
        const search = query.search?.trim()

        const customers = await prisma.customer.findMany({
            where: {
                ...(query.status ? { status: query.status } : {}),
                ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
                ...(query.sectorValueId ? { sectorValueId: query.sectorValueId } : {}),
                ...(query.usageAreaValueId
                    ? { usageAreaValues: { some: { id: query.usageAreaValueId } } }
                    : {}),
                ...(search
                    ? {
                        OR: [
                            { fullName: { contains: search, mode: "insensitive" } },
                            { companyName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                            { phone: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                addresses: {
                    some: coordinateWhere,
                },
            },
            orderBy: [
                { companyName: "asc" },
                { fullName: "asc" },
            ],
            take: MAP_CUSTOMER_LIMIT,
            select: {
                id: true,
                companyName: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
                assignedSalesUserId: true,
                addresses: {
                    where: coordinateWhere,
                    orderBy: [
                        { displayOrder: "asc" },
                        { createdAt: "asc" },
                    ],
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
                        geocodingPlaceId: true,
                    },
                },
            },
        })

        return customers.flatMap((customer) => {
            // Adresler sorguda zaten pencereye göre süzüldü; buradaki seçim
            // görünürdeki adresler arasında yapılır.
            const address = customer.addresses.find((item) => item.isPrimary && item.isShipping)
                ?? customer.addresses.find((item) => item.isPrimary)
                ?? customer.addresses[0]
            const latitude = decimalLikeToNumber(address?.latitude)
            const longitude = decimalLikeToNumber(address?.longitude)

            if (!address || latitude === undefined || longitude === undefined) {
                return []
            }

            return [{
                customerId: customer.id,
                companyName: customer.companyName,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
                status: customer.status,
                assignedSalesUserId: customer.assignedSalesUserId,
                addressId: address.id,
                addressLabel: address.label,
                addressSummary: buildCustomerAddressSummary(address),
                latitude,
                longitude,
                isPrimary: address.isPrimary,
                isShipping: address.isShipping,
                geocodingProvider: address.geocodingProvider ?? null,
                geocodingPlaceId: address.geocodingPlaceId ?? null,
            }]
        })
    }

    const getCustomer = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            include: customerDetailInclude,
        })

    const getCustomerOrThrow = async (id: string) =>
        prisma.customer.findUniqueOrThrow({
            where: { id },
            include: customerDetailInclude,
        })

    const getCustomerPricingContext = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            select: { generalDiscountPercent: true },
        })

    const getCustomerPortalOverview = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            include: customerPortalOverviewInclude,
        })

    const createCustomer = async (data: Prisma.CustomerCreateInput) =>
        prisma.customer.create({
            data,
            include: customerBaseInclude,
        })

    const updateCustomer = async (id: string, data: Prisma.CustomerUpdateInput) =>
        prisma.customer.update({
            where: { id },
            data,
            include: customerBaseInclude,
        })

    const createAddress = async (
        customerId: string,
        data: CustomerAddressMutationInput,
    ) => {
        await prisma.$transaction(async (tx) => {
            const currentMax = await tx.customerAddress.aggregate({
                where: { customerId },
                _max: { displayOrder: true },
            })

            if (data.isPrimary) {
                await tx.customerAddress.updateMany({
                    where: { customerId },
                    data: { isPrimary: false },
                })
            }

            await tx.customerAddress.create({
                data: {
                    customerId,
                    ...(buildAddressWriteData(data, "create") as Prisma.CustomerAddressUncheckedCreateWithoutCustomerInput),
                    displayOrder: (currentMax._max.displayOrder ?? 0) + 1,
                },
            })
        }, addressTransactionOptions)

        // Geniş müşteri detay sorgusu transaction süresine ve commit'e dahil
        // edilmemeli; commit tamamlandıktan sonra güncel kaydı okuyoruz.
        return getCustomerOrThrow(customerId)
    }

    const getAddress = async (customerId: string, addressId: string) =>
        prisma.customerAddress.findFirst({
            where: {
                id: addressId,
                customerId,
            },
            include: customerDetailInclude.addresses.include,
        })

    const updateAddress = async (
        customerId: string,
        addressId: string,
        data: CustomerAddressMutationInput,
    ) => {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.customerAddress.findFirst({
                where: {
                    id: addressId,
                    customerId,
                },
                select: {
                    id: true,
                },
            })

            if (!existing) {
                throw new Error("Customer address not found")
            }

            if (data.isPrimary) {
                await tx.customerAddress.updateMany({
                    where: {
                        customerId,
                        NOT: {
                            id: addressId,
                        },
                    },
                    data: { isPrimary: false },
                })
            }

            await tx.customerAddress.update({
                where: { id: existing.id },
                data: buildAddressWriteData(data, "update") as Prisma.CustomerAddressUncheckedUpdateInput,
            })
        }, addressTransactionOptions)

        return getCustomerOrThrow(customerId)
    }

    const deleteAddress = async (customerId: string, addressId: string) => {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.customerAddress.findFirst({
                where: {
                    id: addressId,
                    customerId,
                },
                select: {
                    id: true,
                },
            })

            if (!existing) {
                throw new Error("Customer address not found")
            }

            await tx.customerAddress.delete({
                where: { id: existing.id },
            })

            const remainingAddresses = await tx.customerAddress.findMany({
                where: { customerId },
                select: {
                    id: true,
                    isPrimary: true,
                    isShipping: true,
                    displayOrder: true,
                    createdAt: true,
                },
            })

            const normalizedAddresses = normalizeAddressOrderingAndFlags(remainingAddresses)

            for (const address of normalizedAddresses) {
                await tx.customerAddress.update({
                    where: { id: address.id },
                    data: {
                        displayOrder: address.displayOrder,
                        isPrimary: address.isPrimary,
                        isShipping: address.isShipping,
                    },
                })
            }
        }, addressTransactionOptions)

        return getCustomerOrThrow(customerId)
    }

    const replaceCompanyContactAssignments = async (
        customerId: string,
        assignments: Array<{
            companyContactId: string
            isActive?: boolean
            displayOrder?: number
            note?: string | null
        }>,
    ) => {
        const uniqueAssignments = normalizeCompanyContactAssignments(assignments)

        return prisma.$transaction(async (tx) => {
            await tx.customerCompanyContactAssignment.deleteMany({
                where: { customerId },
            })

            if (uniqueAssignments.length > 0) {
                await tx.customerCompanyContactAssignment.createMany({
                    data: uniqueAssignments.map((assignment) => ({
                        customerId,
                        ...assignment,
                    })),
                })
            }

            return tx.customer.findUniqueOrThrow({
                where: { id: customerId },
                include: customerBaseInclude,
            })
        })
    }

    const convertCustomer = async (id: string, convertedByUserId: string) =>
        prisma.customer.update({
            where: { id },
            data: {
                status: CustomerStatus.CUSTOMER,
                convertedAt: new Date(),
                convertedByUser: {
                    connect: { id: convertedByUserId },
                },
            },
            include: customerBaseInclude,
        })

    const listFeaturedProducts = async (customerId: string) =>
        prisma.customerFeaturedProduct.findMany({
            where: { customerId },
            orderBy: {
                displayOrder: "asc",
            },
            include: customerProductInclude,
        })

    const replaceFeaturedProducts = async (
        customerId: string,
        productIds: string[],
        createdByUserId: string,
    ) => {
        const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)))

        await prisma.$transaction(async (tx) => {
            await tx.customerFeaturedProduct.deleteMany({
                where: { customerId },
            })

            if (uniqueProductIds.length > 0) {
                await tx.customerFeaturedProduct.createMany({
                    data: uniqueProductIds.map((productId, index) => ({
                        customerId,
                        productId,
                        displayOrder: index,
                        createdByUserId,
                    })),
                })
            }
        })

        return listFeaturedProducts(customerId)
    }

    const listAssignedProducts = async (customerId: string) =>
        prisma.customerAssignedProduct.findMany({
            where: { customerId },
            orderBy: [
                // Temsilci ataması önce, müşterinin kendi favorileri sonra;
                // aynı kaynak içinde displayOrder korunur.
                { source: "asc" },
                { displayOrder: "asc" },
            ],
            include: customerAssignedProductVariantInclude,
        })

    const replaceAssignedProducts = async (
        customerId: string,
        productVariantIds: string[],
        createdByUserId: string,
    ) => {
        const uniqueProductVariantIds = Array.from(new Set(productVariantIds.filter(Boolean)))

        await prisma.$transaction(async (tx) => {
            // KAYNAK İZOLASYONU (kritik): silme YALNIZ temsilci atamalarını kapsar.
            // Kapsam daraltılmazsa temsilcinin listeyi kaydetmesi, müşterinin kalple
            // eklediği favorileri de siler.
            await tx.customerAssignedProduct.deleteMany({
                where: { customerId, source: CustomerAssignedProductSource.STAFF },
            })

            if (uniqueProductVariantIds.length > 0) {
                await tx.customerAssignedProduct.createMany({
                    data: uniqueProductVariantIds.map((productVariantId, index) => ({
                        customerId,
                        productVariantId,
                        displayOrder: index,
                        source: CustomerAssignedProductSource.STAFF,
                        createdByUserId,
                    })),
                })
            }
        })

        return listAssignedProducts(customerId)
    }

    /**
     * Müşterinin kendi kalp işareti. `source: CUSTOMER` satırlarına dokunur;
     * temsilci ataması (STAFF) aynı varyant için ayrı satırda durmaya devam eder.
     *
     * Zaten favorideyse yeni satır üretmez — kalp butonu çift tıklamaya ve
     * eşzamanlı isteklere karşı bu sayede dayanıklıdır (unique kısıt da korur).
     */
    const addCustomerFavoriteVariant = async (
        customerId: string,
        productVariantId: string,
        createdByUserId: string,
    ) => {
        const lastFavorite = await prisma.customerAssignedProduct.findFirst({
            where: { customerId, source: CustomerAssignedProductSource.CUSTOMER },
            orderBy: { displayOrder: "desc" },
            select: { displayOrder: true },
        })

        await prisma.customerAssignedProduct.upsert({
            where: {
                customerId_productVariantId_source: {
                    customerId,
                    productVariantId,
                    source: CustomerAssignedProductSource.CUSTOMER,
                },
            },
            create: {
                customerId,
                productVariantId,
                source: CustomerAssignedProductSource.CUSTOMER,
                displayOrder: (lastFavorite?.displayOrder ?? -1) + 1,
                createdByUserId,
            },
            // Var olan favori yeniden eklenirse sahiplik/sıra değişmemeli.
            update: {},
        })

        return listAssignedProducts(customerId)
    }

    const removeCustomerFavoriteVariant = async (
        customerId: string,
        productVariantId: string,
    ) => {
        await prisma.customerAssignedProduct.deleteMany({
            where: {
                customerId,
                productVariantId,
                source: CustomerAssignedProductSource.CUSTOMER,
            },
        })

        return listAssignedProducts(customerId)
    }

    const listVisits = async (customerId: string) =>
        prisma.customerVisit.findMany({
            where: { customerId },
            orderBy: [
                { scheduledAt: "desc" },
                { createdAt: "desc" },
            ],
            include: customerDetailInclude.visits.include,
        })

    const createVisit = async (data: Prisma.CustomerVisitCreateInput) =>
        prisma.customerVisit.create({
            data,
            include: customerDetailInclude.visits.include,
        })

    const updateVisit = async (id: string, data: Prisma.CustomerVisitUpdateInput) =>
        prisma.customerVisit.update({
            where: { id },
            data,
            include: customerDetailInclude.visits.include,
        })

    const deleteVisit = async (id: string) =>
        prisma.customerVisit.delete({
            where: { id },
            include: customerDetailInclude.visits.include,
        })

    return {
        listCustomers,
        listCustomersForMap,
        getCustomer,
        getCustomerPricingContext,
        getCustomerPortalOverview,
        createCustomer,
        updateCustomer,
        createAddress,
        getAddress,
        updateAddress,
        deleteAddress,
        replaceCompanyContactAssignments,
        convertCustomer,
        replaceFeaturedProducts,
        listFeaturedProducts,
        replaceAssignedProducts,
        listAssignedProducts,
        addCustomerFavoriteVariant,
        removeCustomerFavoriteVariant,
        listVisits,
        createVisit,
        updateVisit,
        deleteVisit,
    }
}

export { CustomerStatus, CustomerVisitStatus }
