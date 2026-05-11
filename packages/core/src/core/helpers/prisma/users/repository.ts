import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { IUser } from "@/core/db/interfaces/user"
import type { Prisma, User } from "@/prisma/generated/prisma/client"

const userInclude = {
    supplier: {
        select: {
            id: true,
            name: true,
        },
    },
    customer: {
        select: {
            id: true,
            fullName: true,
            companyName: true,
            status: true,
        },
    },
    assignedSalesCustomers: {
        select: {
            id: true,
            fullName: true,
            companyName: true,
            status: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    },
    assignedPurchasingSuppliers: {
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    },
} satisfies Prisma.UserInclude

export type UserWithRelations = Prisma.UserGetPayload<{
    include: typeof userInclude
}>

export interface IPrismaUserRepository {
    listUsers(query: IPaginationQuery): Promise<{
        data: UserWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getUserById(id: string): Promise<UserWithRelations | null>
    getUserByCognitoSub(sub: string): Promise<IUser | null>
    createUser(data: Prisma.UserCreateInput): Promise<IUser>
    updateGroups(id: string, groups: string[]): Promise<IUser>
    updateAssignments(
        id: string,
        groups: string[],
        assignments: {
            supplierId?: string | null
            customerId?: string | null
            assignedSupplierIds?: string[]
            assignedCustomerIds?: string[]
        },
    ): Promise<UserWithRelations>
}

export const userRepository = (): IPrismaUserRepository => {
    const listUsers = async (query: IPaginationQuery) => {
        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<User>(query, {
            searchableFields: ["email", "identifier"],
            defaultSort: "createdAt",
        })

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy,
                skip,
                take,
                include: userInclude,
            }),
            prisma.user.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getUserById = async (id: string) =>
        prisma.user.findUnique({
            where: { id },
            include: userInclude,
        })

    const getUserByCognitoSub = async (sub: string) =>
        prisma.user.findUnique({ where: { cognitoSub: sub } })

    const createUser = async (data: Prisma.UserCreateInput) =>
        prisma.user.create({ data })

    const updateGroups = async (id: string, groups: string[]) =>
        prisma.user.update({
            where: { id },
            data: { groups },
        })

    const updateAssignments = async (
        id: string,
        groups: string[],
        assignments: {
            supplierId?: string | null
            customerId?: string | null
            assignedSupplierIds?: string[]
            assignedCustomerIds?: string[]
        },
    ) => {
        return prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: {
                    groups,
                    ...(assignments.supplierId !== undefined ? { supplierId: assignments.supplierId } : {}),
                    ...(assignments.customerId !== undefined ? { customerId: assignments.customerId } : {}),
                },
            })

            if (assignments.assignedSupplierIds !== undefined) {
                await tx.supplier.updateMany({
                    where: {
                        assignedPurchasingUserId: id,
                    },
                    data: {
                        assignedPurchasingUserId: null,
                    },
                })

                if (assignments.assignedSupplierIds.length > 0) {
                    await tx.supplier.updateMany({
                        where: {
                            id: {
                                in: assignments.assignedSupplierIds,
                            },
                        },
                        data: {
                            assignedPurchasingUserId: id,
                        },
                    })
                }
            }

            if (assignments.assignedCustomerIds !== undefined) {
                await tx.customer.updateMany({
                    where: {
                        assignedSalesUserId: id,
                    },
                    data: {
                        assignedSalesUserId: null,
                    },
                })

                if (assignments.assignedCustomerIds.length > 0) {
                    await tx.customer.updateMany({
                        where: {
                            id: {
                                in: assignments.assignedCustomerIds,
                            },
                        },
                        data: {
                            assignedSalesUserId: id,
                        },
                    })
                }
            }

            return tx.user.findUniqueOrThrow({
                where: { id },
                include: userInclude,
            })
        })
    }

    return {
        listUsers,
        getUserById,
        getUserByCognitoSub,
        createUser,
        updateGroups,
        updateAssignments,
    }
}
