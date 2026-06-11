import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { CustomerVariantSpecialPrice, Prisma } from "@/prisma/generated/prisma/client"

const userSummarySelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    groups: true,
} as const

const specialPriceInclude = {
    customer: {
        select: {
            id: true,
            fullName: true,
            companyName: true,
            generalDiscountPercent: true,
            assignedSalesUserId: true,
        },
    },
    productVariant: {
        include: {
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
            product: {
                include: {
                    category: true,
                    assets: true,
                },
            },
            variantSuppliers: {
                include: {
                    supplier: true,
                },
                orderBy: [
                    { isActive: "desc" },
                    { supplier: { name: "asc" } },
                ],
            },
        },
    },
    createdByUser: {
        select: userSummarySelect,
    },
    approvedByUser: {
        select: userSummarySelect,
    },
} satisfies Prisma.CustomerVariantSpecialPriceInclude

export type CustomerVariantSpecialPriceWithRelations = Prisma.CustomerVariantSpecialPriceGetPayload<{
    include: typeof specialPriceInclude
}>

export type CustomerVariantSpecialPriceListQuery = IPaginationQuery & {
    customerId?: string
    productVariantId?: string
    isActive?: boolean
    currentOnly?: boolean
}

export interface IPrismaCustomerVariantSpecialPriceRepository {
    listSpecialPrices(query: CustomerVariantSpecialPriceListQuery): Promise<{
        data: CustomerVariantSpecialPriceWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    listActiveCustomerSpecialPrices(customerId: string, now?: Date): Promise<CustomerVariantSpecialPriceWithRelations[]>
    listActiveByCustomerAndVariantIds(
        customerId: string,
        productVariantIds: string[],
        now?: Date,
    ): Promise<CustomerVariantSpecialPriceWithRelations[]>
    getSpecialPrice(id: string): Promise<CustomerVariantSpecialPriceWithRelations | null>
    getByCustomerAndVariant(
        customerId: string,
        productVariantId: string,
    ): Promise<CustomerVariantSpecialPriceWithRelations | null>
    createSpecialPrice(data: Prisma.CustomerVariantSpecialPriceCreateInput): Promise<CustomerVariantSpecialPriceWithRelations>
    updateSpecialPrice(
        id: string,
        data: Prisma.CustomerVariantSpecialPriceUpdateInput,
    ): Promise<CustomerVariantSpecialPriceWithRelations>
    deactivateSpecialPrice(id: string): Promise<CustomerVariantSpecialPriceWithRelations>
}

function currentValidityWhere(now: Date): Prisma.CustomerVariantSpecialPriceWhereInput {
    return {
        AND: [
            {
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: now } },
                ],
            },
            {
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: now } },
                ],
            },
        ],
    }
}

export const customerVariantSpecialPriceRepository = (): IPrismaCustomerVariantSpecialPriceRepository => {
    const listSpecialPrices = async (query: CustomerVariantSpecialPriceListQuery) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<CustomerVariantSpecialPrice>(query, {
            searchableFields: ["contractReference", "note", "internalNote"],
            defaultSort: "createdAt",
        })
        const now = new Date()

        const finalWhere: Prisma.CustomerVariantSpecialPriceWhereInput = {
            ...where,
            ...(query.customerId ? { customerId: query.customerId } : {}),
            ...(query.productVariantId ? { productVariantId: query.productVariantId } : {}),
            ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
            ...(query.currentOnly ? currentValidityWhere(now) : {}),
            ...(query.search
                ? {
                    OR: [
                        { contractReference: { contains: query.search, mode: "insensitive" } },
                        { note: { contains: query.search, mode: "insensitive" } },
                        { internalNote: { contains: query.search, mode: "insensitive" } },
                        { productVariant: { fullCode: { contains: query.search, mode: "insensitive" } } },
                        { productVariant: { name: { contains: query.search, mode: "insensitive" } } },
                        { productVariant: { product: { name: { contains: query.search, mode: "insensitive" } } } },
                        { productVariant: { product: { code: { contains: query.search, mode: "insensitive" } } } },
                    ],
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.customerVariantSpecialPrice.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: specialPriceInclude,
            }),
            prisma.customerVariantSpecialPrice.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listActiveCustomerSpecialPrices = (customerId: string, now = new Date()) =>
        prisma.customerVariantSpecialPrice.findMany({
            where: {
                customerId,
                isActive: true,
                ...currentValidityWhere(now),
            },
            orderBy: [
                { productVariant: { product: { code: "asc" } } },
                { productVariant: { fullCode: "asc" } },
            ],
            include: specialPriceInclude,
        })

    const listActiveByCustomerAndVariantIds = (
        customerId: string,
        productVariantIds: string[],
        now = new Date(),
    ) => {
        const uniqueIds = Array.from(new Set(productVariantIds.filter(Boolean)))
        if (uniqueIds.length === 0) return Promise.resolve([])

        return prisma.customerVariantSpecialPrice.findMany({
            where: {
                customerId,
                productVariantId: { in: uniqueIds },
                isActive: true,
                ...currentValidityWhere(now),
            },
            include: specialPriceInclude,
        })
    }

    const getSpecialPrice = (id: string) =>
        prisma.customerVariantSpecialPrice.findUnique({
            where: { id },
            include: specialPriceInclude,
        })

    const getByCustomerAndVariant = (customerId: string, productVariantId: string) =>
        prisma.customerVariantSpecialPrice.findUnique({
            where: {
                customerId_productVariantId: {
                    customerId,
                    productVariantId,
                },
            },
            include: specialPriceInclude,
        })

    const createSpecialPrice = (data: Prisma.CustomerVariantSpecialPriceCreateInput) =>
        prisma.customerVariantSpecialPrice.create({
            data,
            include: specialPriceInclude,
        })

    const updateSpecialPrice = (id: string, data: Prisma.CustomerVariantSpecialPriceUpdateInput) =>
        prisma.customerVariantSpecialPrice.update({
            where: { id },
            data,
            include: specialPriceInclude,
        })

    const deactivateSpecialPrice = (id: string) =>
        prisma.customerVariantSpecialPrice.update({
            where: { id },
            data: { isActive: false },
            include: specialPriceInclude,
        })

    return {
        listSpecialPrices,
        listActiveCustomerSpecialPrices,
        listActiveByCustomerAndVariantIds,
        getSpecialPrice,
        getByCustomerAndVariant,
        createSpecialPrice,
        updateSpecialPrice,
        deactivateSpecialPrice,
    }
}
