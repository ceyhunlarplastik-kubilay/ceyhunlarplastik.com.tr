import { prisma } from "@/core/db/prisma"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginatedResult } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { OrderStatus, Prisma } from "@/prisma/generated/prisma/client"

export const orderInclude = {
    customer: {
        select: {
            id: true,
            companyName: true,
            fullName: true,
            email: true,
            phone: true,
            assignedSalesUserId: true,
            assignedSalesUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    firstName: true,
                    lastName: true,
                    groups: true,
                },
            },
        },
    },
    requestedByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
            firstName: true,
            lastName: true,
            groups: true,
        },
    },
    shippingAddress: true,
    sourceRequest: {
        select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    items: {
        orderBy: {
            displayOrder: "asc",
        },
        include: {
            productVariant: {
                include: {
                    product: {
                        include: {
                            category: true,
                            assets: true,
                        },
                    },
                    measurements: {
                        include: {
                            measurementType: true,
                        },
                    },
                    color: true,
                    materials: true,
                },
            },
        },
    },
} satisfies Prisma.OrderInclude

export type OrderWithRelations = Prisma.OrderGetPayload<{
    include: typeof orderInclude
}>

export interface IPrismaOrderRepository {
    getOrder(id: string): Promise<OrderWithRelations | null>
    listOrders(query: IPaginationQuery & {
        status?: OrderStatus
        customerId?: string
        requestedByUserId?: string
        customerAssignedSalesUserId?: string
    }): Promise<IPaginatedResult<OrderWithRelations>>
}

export const orderRepository = (): IPrismaOrderRepository => {
    const getOrder = (id: string) =>
        prisma.order.findUnique({
            where: { id },
            include: orderInclude,
        })

    const listOrders = async (query: IPaginationQuery & {
        status?: OrderStatus
        customerId?: string
        requestedByUserId?: string
        customerAssignedSalesUserId?: string
    }) => {
        const page = query.page && query.page > 0 ? query.page : 1
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
        const skip = (page - 1) * limit
        const order = query.order === "asc" ? "asc" : "desc"
        const allowedSortFields = new Set(["createdAt", "updatedAt", "orderNumber", "status", "requestedDeliveryDate"])
        const sortField = allowedSortFields.has(query.sort ?? "") ? query.sort! : "createdAt"

        const where: Prisma.OrderWhereInput = {
            ...(query.status ? { status: query.status } : {}),
            ...(query.customerId ? { customerId: query.customerId } : {}),
            ...(query.requestedByUserId ? { requestedByUserId: query.requestedByUserId } : {}),
            ...(query.customerAssignedSalesUserId
                ? {
                    customer: {
                        assignedSalesUserId: query.customerAssignedSalesUserId,
                    },
                }
                : {}),
            ...(query.search
                ? {
                    OR: [
                        { orderNumber: { contains: query.search, mode: "insensitive" } },
                        { title: { contains: query.search, mode: "insensitive" } },
                        { referenceCode: { contains: query.search, mode: "insensitive" } },
                        { customer: { companyName: { contains: query.search, mode: "insensitive" } } },
                        { customer: { fullName: { contains: query.search, mode: "insensitive" } } },
                    ],
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: orderInclude,
                skip,
                take: limit,
                orderBy: {
                    [sortField]: order,
                },
            }),
            prisma.order.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        getOrder,
        listOrders,
    }
}
