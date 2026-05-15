import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
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
};
export const userRepository = () => {
    const listUsers = async (query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            searchableFields: ["email", "identifier"],
            defaultSort: "createdAt",
        });
        if (query.accessStatus) {
            where.accessStatus = query.accessStatus;
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
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const getUserById = async (id) => prisma.user.findUnique({
        where: { id },
        include: userInclude,
    });
    const getUserByCognitoSub = async (sub) => prisma.user.findUnique({ where: { cognitoSub: sub } });
    const getUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });
    const createUser = async (data) => prisma.user.create({ data });
    const listActiveUsersByGroups = async (groups) => prisma.user.findMany({
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
            groups: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    const updateGroups = async (id, groups) => prisma.user.update({
        where: { id },
        data: { groups },
    });
    const updateAssignments = async (id, groups, assignments) => {
        return prisma.$transaction(async (tx) => {
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
                },
            });
            if (assignments.assignedSupplierIds !== undefined) {
                await tx.supplier.updateMany({
                    where: {
                        assignedPurchasingUserId: id,
                    },
                    data: {
                        assignedPurchasingUserId: null,
                    },
                });
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
                    });
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
                });
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
                    });
                }
            }
            return tx.user.findUniqueOrThrow({
                where: { id },
                include: userInclude,
            });
        });
    };
    return {
        listUsers,
        getUserById,
        getUserByCognitoSub,
        getUserByEmail,
        createUser,
        listActiveUsersByGroups,
        updateGroups,
        updateAssignments,
    };
};
