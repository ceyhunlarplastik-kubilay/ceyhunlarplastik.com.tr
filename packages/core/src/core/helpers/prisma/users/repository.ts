import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { IUser } from "@/core/db/interfaces/user"
import type { Prisma, User } from "@/prisma/generated/prisma/client"

export type UserAccessStatus = "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"

export type UserListQuery = IPaginationQuery & {
    accessStatus?: UserAccessStatus
}

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
    listUsers(query: UserListQuery): Promise<{
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
    getUserByEmail(email: string): Promise<IUser | null>
    createUser(data: Prisma.UserCreateInput): Promise<IUser>
    listActiveUsersByGroups(groups: string[]): Promise<Array<{
        id: string
        email: string
        identifier: string
        firstName?: string | null
        lastName?: string | null
        groups: string[]
    }>>
    updateGroups(id: string, groups: string[]): Promise<IUser>
    updateAssignments(
        id: string,
        groups: string[],
        assignments: {
            supplierId?: string | null
            customerId?: string | null
            assignedSupplierIds?: string[]
            assignedCustomerIds?: string[]
            accessStatus?: UserAccessStatus
            accessStatusChangedAt?: Date | null
            accessStatusChangedByUserId?: string | null
            accessStatusReason?: string | null
        },
    ): Promise<UserWithRelations>
    updateProfile(
        id: string,
        data: {
            email?: string
            identifier?: string
            firstName?: string | null
            lastName?: string | null
            phone?: string | null
            customerContactTitle?: string | null
            customerContactDepartment?: string | null
            isPrimaryCustomerContact?: boolean
        },
    ): Promise<UserWithRelations>
    updateImageKey(id: string, imageKey: string | null): Promise<UserWithRelations>
}

export const userRepository = (): IPrismaUserRepository => {
    const listUsers = async (query: UserListQuery) => {
        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<User>(query, {
            searchableFields: ["email", "identifier", "firstName", "lastName", "phone"],
            defaultSort: "createdAt",
        })

        if (query.accessStatus) {
            where.accessStatus = query.accessStatus
        }

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

    const getUserByEmail = async (email: string) =>
        prisma.user.findUnique({ where: { email } })

    const createUser = async (data: Prisma.UserCreateInput) =>
        prisma.user.create({ data })

    const listActiveUsersByGroups = async (groups: string[]) =>
        prisma.user.findMany({
            where: {
                isActive: true,
                accessStatus: "ACTIVE",
                groups: {
                    hasSome: groups,
                },
            },
            select: {
                id: true,
                email: true,
                identifier: true,
                firstName: true,
                lastName: true,
                groups: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        })

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
            accessStatus?: UserAccessStatus
            accessStatusChangedAt?: Date | null
            accessStatusChangedByUserId?: string | null
            accessStatusReason?: string | null
        },
    ) => {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUniqueOrThrow({
                where: { id },
                select: {
                    customerId: true,
                },
            })

            await tx.user.update({
                where: { id },
                data: {
                    groups,
                    ...(assignments.accessStatus !== undefined ? { accessStatus: assignments.accessStatus } : {}),
                    ...(assignments.accessStatusChangedAt !== undefined ? { accessStatusChangedAt: assignments.accessStatusChangedAt } : {}),
                    ...(assignments.accessStatusChangedByUserId !== undefined ? { accessStatusChangedByUserId: assignments.accessStatusChangedByUserId } : {}),
                    ...(assignments.accessStatusReason !== undefined ? { accessStatusReason: assignments.accessStatusReason } : {}),
                    ...(assignments.supplierId !== undefined ? { supplierId: assignments.supplierId } : {}),
                    ...(assignments.customerId !== undefined ? { customerId: assignments.customerId } : {}),
                    ...(
                        assignments.customerId !== undefined
                        ? assignments.customerId === null || assignments.customerId !== existing.customerId
                            ? {
                                customerContactTitle: null,
                                customerContactDepartment: null,
                                isPrimaryCustomerContact: false,
                            }
                            : {}
                        : {}
                    ),
                },
            })

            if (assignments.assignedSupplierIds !== undefined) {
                await tx.user.update({
                    where: { id },
                    data: {
                        assignedPurchasingSuppliers: {
                            set: [],
                        },
                    },
                })

                if (assignments.assignedSupplierIds.length > 0) {
                    await tx.user.update({
                        where: { id },
                        data: {
                            assignedPurchasingSuppliers: {
                                connect: assignments.assignedSupplierIds.map((supplierId) => ({ id: supplierId })),
                            },
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

    const updateProfile = async (
        id: string,
        data: {
            email?: string
            identifier?: string
            firstName?: string | null
            lastName?: string | null
            phone?: string | null
            customerContactTitle?: string | null
            customerContactDepartment?: string | null
            isPrimaryCustomerContact?: boolean
        },
    ) =>
        prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUniqueOrThrow({
                where: { id },
                select: {
                    customerId: true,
                },
            })

            const hasCustomerLink = Boolean(existing.customerId)
            const normalizedTitle = hasCustomerLink
                ? (data.customerContactTitle === undefined ? undefined : data.customerContactTitle)
                : null
            const normalizedDepartment = hasCustomerLink
                ? (data.customerContactDepartment === undefined ? undefined : data.customerContactDepartment)
                : null
            const normalizedPrimary = hasCustomerLink
                ? (data.isPrimaryCustomerContact === undefined ? undefined : data.isPrimaryCustomerContact)
                : false

            if (hasCustomerLink && normalizedPrimary && existing.customerId) {
                await tx.user.updateMany({
                    where: {
                        customerId: existing.customerId,
                        id: {
                            not: id,
                        },
                    },
                    data: {
                        isPrimaryCustomerContact: false,
                    },
                })
            }

            return tx.user.update({
                where: { id },
                data: {
                    ...(data.email !== undefined ? { email: data.email } : {}),
                    ...(data.identifier !== undefined ? { identifier: data.identifier } : {}),
                    ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
                    ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
                    ...(data.phone !== undefined ? { phone: data.phone } : {}),
                    ...(normalizedTitle !== undefined ? { customerContactTitle: normalizedTitle } : {}),
                    ...(normalizedDepartment !== undefined ? { customerContactDepartment: normalizedDepartment } : {}),
                    ...(normalizedPrimary !== undefined ? { isPrimaryCustomerContact: normalizedPrimary } : {}),
                },
                include: userInclude,
            })
        })

    const updateImageKey = async (id: string, imageKey: string | null) =>
        prisma.user.update({
            where: { id },
            data: {
                imageKey,
            },
            include: userInclude,
        })

    return {
        listUsers,
        getUserById,
        getUserByCognitoSub,
        getUserByEmail,
        createUser,
        listActiveUsersByGroups,
        updateGroups,
        updateAssignments,
        updateProfile,
        updateImageKey,
    }
}
