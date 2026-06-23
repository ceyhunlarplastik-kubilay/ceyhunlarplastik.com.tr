import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { normalizeCompanyContactAssignments } from "@/core/helpers/crm/companyContactAssignments"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import {
    CustomerAddressLocationAccuracy,
    CustomerAddressLocationSource,
    CustomerStatus,
    CustomerVisitStatus,
} from "@/prisma/generated/prisma/enums"
import { Customer, Prisma } from "@/prisma/generated/prisma/client"

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
} as const

export const customerAssignedProductVariantInclude = {
    createdByUser: {
        select: customerUserSummarySelect,
    },
    productVariant: {
        include: {
            product: customerProductInclude.product,
            color: true,
            materials: true,
            assets: true,
            measurements: {
                orderBy: [
                    { measurementType: { displayOrder: "asc" } },
                    { measurementType: { code: "asc" } },
                    { value: "asc" },
                    { label: "asc" },
                ],
                include: {
                    measurementType: true,
                },
            },
        },
    },
} as const

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

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
    include: typeof customerBaseInclude
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
    fullName: string
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
                geocodingRaw: data.geocodingRaw ?? Prisma.JsonNull,
            }
        }

        return Object.fromEntries(
            Object.entries({
                ...base,
                geocodingRaw: data.geocodingRaw === undefined ? undefined : data.geocodingRaw ?? Prisma.JsonNull,
                locationVerifiedByUserId: data.locationVerifiedByUserId === undefined ? undefined : data.locationVerifiedByUserId,
            }).filter(([, value]) => value !== undefined),
        ) as Prisma.CustomerAddressUncheckedUpdateInput
    }

    const buildMapAddressSummary = (address: {
        line1: string
        district?: string | null
        city: string
        country: string
    }) => [address.line1, address.district, address.city, address.country].filter(Boolean).join(", ")

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

        const [data, total] = await Promise.all([
            prisma.customer.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: customerBaseInclude,
            }),
            prisma.customer.count({ where: finalWhere }),
        ])

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
    }) => {
        const south = Math.min(query.south, query.north)
        const north = Math.max(query.south, query.north)
        const west = Math.min(query.west, query.east)
        const east = Math.max(query.west, query.east)
        const coordinateWhere: Prisma.CustomerAddressWhereInput = {
            latitude: { not: null },
            longitude: { not: null },
        }
        const search = query.search?.trim()

        const customers = await prisma.customer.findMany({
            where: {
                ...(query.status ? { status: query.status } : {}),
                ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
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
                    },
                },
            },
        })

        return customers.flatMap((customer) => {
            const address = customer.addresses.find((item) => item.isPrimary && item.isShipping)
                ?? customer.addresses.find((item) => item.isPrimary)
                ?? customer.addresses[0]
            const latitude = decimalLikeToNumber(address?.latitude)
            const longitude = decimalLikeToNumber(address?.longitude)

            if (
                !address
                || latitude === undefined
                || longitude === undefined
                || latitude < south
                || latitude > north
                || longitude < west
                || longitude > east
            ) {
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
                addressSummary: buildMapAddressSummary(address),
                latitude,
                longitude,
                isPrimary: address.isPrimary,
                isShipping: address.isShipping,
            }]
        })
    }

    const getCustomer = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            include: customerDetailInclude,
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
    ) =>
        prisma.$transaction(async (tx) => {
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

            return tx.customer.findUniqueOrThrow({
                where: { id: customerId },
                include: customerDetailInclude,
            })
        })

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
    ) =>
        prisma.$transaction(async (tx) => {
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

            return tx.customer.findUniqueOrThrow({
                where: { id: customerId },
                include: customerDetailInclude,
            })
        })

    const deleteAddress = async (customerId: string, addressId: string) =>
        prisma.$transaction(async (tx) => {
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

            return tx.customer.findUniqueOrThrow({
                where: { id: customerId },
                include: customerDetailInclude,
            })
        })

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
            orderBy: {
                displayOrder: "asc",
            },
            include: customerAssignedProductVariantInclude,
        })

    const replaceAssignedProducts = async (
        customerId: string,
        productVariantIds: string[],
        createdByUserId: string,
    ) => {
        const uniqueProductVariantIds = Array.from(new Set(productVariantIds.filter(Boolean)))

        await prisma.$transaction(async (tx) => {
            await tx.customerAssignedProduct.deleteMany({
                where: { customerId },
            })

            if (uniqueProductVariantIds.length > 0) {
                await tx.customerAssignedProduct.createMany({
                    data: uniqueProductVariantIds.map((productVariantId, index) => ({
                        customerId,
                        productVariantId,
                        displayOrder: index,
                        createdByUserId,
                    })),
                })
            }
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
        listVisits,
        createVisit,
        updateVisit,
        deleteVisit,
    }
}

export { CustomerStatus, CustomerVisitStatus }
