import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { CustomerStatus, CustomerVisitStatus } from "@/prisma/generated/prisma/enums"
import { Customer, Prisma } from "@/prisma/generated/prisma/client"

const customerBaseInclude = {
    sectorValue: {
        include: {
            attribute: true,
        },
    },
    productionGroupValue: {
        include: {
            attribute: true,
        },
    },
    usageAreaValues: {
        include: {
            attribute: true,
        },
    },
    assignedSalesUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
    },
    convertedByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            groups: true,
        },
    },
} satisfies Prisma.CustomerInclude

const customerProductInclude = {
    createdByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
        },
    },
    product: {
        include: {
            category: true,
            assets: true,
            attributeValues: {
                include: {
                    attribute: true,
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
        include: customerProductInclude,
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
        },
    },
    visits: {
        orderBy: [
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
        include: {
            ownerUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
            createdByUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
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

export type CustomerFeaturedProductWithRelations = Prisma.CustomerFeaturedProductGetPayload<{
    include: typeof customerProductInclude
}>

export type CustomerAssignedProductWithRelations = Prisma.CustomerAssignedProductGetPayload<{
    include: typeof customerProductInclude
}>

export type CustomerAddressRecord = Prisma.CustomerAddressGetPayload<{
    include: typeof customerDetailInclude.addresses.include
}>

export type CustomerVisitWithRelations = Prisma.CustomerVisitGetPayload<{
    include: typeof customerDetailInclude.visits.include
}>

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
    convertCustomer(id: string, convertedByUserId: string): Promise<CustomerWithRelations>
    replaceFeaturedProducts(
        customerId: string,
        productIds: string[],
        createdByUserId: string,
    ): Promise<CustomerFeaturedProductWithRelations[]>
    listFeaturedProducts(customerId: string): Promise<CustomerFeaturedProductWithRelations[]>
    replaceAssignedProducts(
        customerId: string,
        productIds: string[],
        createdByUserId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    listAssignedProducts(customerId: string): Promise<CustomerAssignedProductWithRelations[]>
    listVisits(customerId: string): Promise<CustomerVisitWithRelations[]>
    createVisit(data: Prisma.CustomerVisitCreateInput): Promise<CustomerVisitWithRelations>
    updateVisit(id: string, data: Prisma.CustomerVisitUpdateInput): Promise<CustomerVisitWithRelations>
    deleteVisit(id: string): Promise<CustomerVisitWithRelations>
}

export const customerRepository = (): IPrismaCustomerRepository => {
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
            include: customerProductInclude,
        })

    const replaceAssignedProducts = async (
        customerId: string,
        productIds: string[],
        createdByUserId: string,
    ) => {
        const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)))

        await prisma.$transaction(async (tx) => {
            await tx.customerAssignedProduct.deleteMany({
                where: { customerId },
            })

            if (uniqueProductIds.length > 0) {
                await tx.customerAssignedProduct.createMany({
                    data: uniqueProductIds.map((productId, index) => ({
                        customerId,
                        productId,
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
        getCustomer,
        createCustomer,
        updateCustomer,
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
