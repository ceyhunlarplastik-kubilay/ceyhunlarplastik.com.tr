import { prisma } from "@/core/db/prisma";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const businessRequestInclude = {
    customer: {
        select: {
            id: true,
            fullName: true,
            companyName: true,
            assignedSalesUserId: true,
            assignedSalesUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
        },
    },
    supplier: {
        select: {
            id: true,
            name: true,
            assignedPurchasingUserId: true,
            assignedPurchasingUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
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
            groups: true,
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
    approvalSteps: {
        orderBy: {
            stepOrder: "asc",
        },
        include: {
            assignedUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
            decidedByUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
        },
    },
    activityLogs: {
        orderBy: {
            createdAt: "desc",
        },
        include: {
            actorUser: {
                select: {
                    id: true,
                    email: true,
                    identifier: true,
                    groups: true,
                },
            },
        },
    },
};
export const businessRequestWorkflowSelect = {
    id: true,
    domain: true,
    type: true,
    title: true,
    status: true,
    customerId: true,
    supplierId: true,
    requestedByUserId: true,
    requesterRole: true,
    workflowExecutionArn: true,
    workflowTaskToken: true,
    requestedByUser: {
        select: {
            email: true,
        },
    },
    approvalSteps: {
        orderBy: {
            stepOrder: "asc",
        },
        select: {
            id: true,
            stepOrder: true,
            requiredRole: true,
            assignedUserId: true,
            status: true,
        },
    },
};
export const businessRequestRepository = () => {
    const createRequest = (data) => prisma.businessRequest.create({
        data,
        include: businessRequestInclude,
    });
    const deleteRequest = async (id) => {
        await prisma.businessRequest.delete({
            where: { id },
        });
    };
    const getRequest = (id) => prisma.businessRequest.findUnique({
        where: { id },
        include: businessRequestInclude,
    });
    const getWorkflowRequest = (id) => prisma.businessRequest.findUnique({
        where: { id },
        select: businessRequestWorkflowSelect,
    });
    const listRequests = async (query) => {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
        const skip = (page - 1) * limit;
        const order = query.order === "asc" ? "asc" : "desc";
        const allowedSortFields = new Set(["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"]);
        const sortField = allowedSortFields.has(query.sort ?? "") ? query.sort : "createdAt";
        const where = {
            ...(query.domain ? { domain: query.domain } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { type: query.type } : {}),
            ...(query.requestedByUserId ? { requestedByUserId: query.requestedByUserId } : {}),
            ...(query.customerId ? { customerId: query.customerId } : {}),
            ...(query.supplierId ? { supplierId: query.supplierId } : {}),
            ...(query.customerAssignedSalesUserId
                ? {
                    customer: {
                        assignedSalesUserId: query.customerAssignedSalesUserId,
                    },
                }
                : {}),
            ...(query.supplierAssignedPurchasingUserId
                ? {
                    supplier: {
                        assignedPurchasingUserId: query.supplierAssignedPurchasingUserId,
                    },
                }
                : {}),
            ...((query.requiredRole || query.assignedUserId || query.stepStatus)
                ? {
                    approvalSteps: {
                        some: {
                            ...(query.requiredRole ? { requiredRole: query.requiredRole } : {}),
                            ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
                            ...(query.stepStatus ? { status: query.stepStatus } : {}),
                        },
                    },
                }
                : {}),
            ...(query.search
                ? {
                    OR: [
                        { title: { contains: query.search, mode: "insensitive" } },
                        { description: { contains: query.search, mode: "insensitive" } },
                        { requestedByUser: { email: { contains: query.search, mode: "insensitive" } } },
                        { requestedByUser: { identifier: { contains: query.search, mode: "insensitive" } } },
                        { customer: { fullName: { contains: query.search, mode: "insensitive" } } },
                        { customer: { companyName: { contains: query.search, mode: "insensitive" } } },
                        { supplier: { name: { contains: query.search, mode: "insensitive" } } },
                    ],
                }
                : {}),
        };
        const [data, total] = await Promise.all([
            prisma.businessRequest.findMany({
                where,
                include: businessRequestInclude,
                orderBy: { [sortField]: order },
                skip,
                take: limit,
            }),
            prisma.businessRequest.count({ where }),
        ]);
        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    };
    const updateWorkflowExecutionArn = (id, workflowExecutionArn) => prisma.businessRequest.update({
        where: { id },
        data: { workflowExecutionArn },
        include: businessRequestInclude,
    });
    const updateWorkflowTaskToken = (id, workflowTaskToken) => prisma.businessRequest.update({
        where: { id },
        data: { workflowTaskToken },
        include: businessRequestInclude,
    });
    const setWorkflowExecutionArn = async (id, workflowExecutionArn) => {
        await prisma.businessRequest.update({
            where: { id },
            data: { workflowExecutionArn },
            select: { id: true },
        });
    };
    const setWorkflowTaskToken = async (id, workflowTaskToken) => {
        await prisma.businessRequest.update({
            where: { id },
            data: { workflowTaskToken },
            select: { id: true },
        });
    };
    return {
        createRequest,
        deleteRequest,
        getRequest,
        getWorkflowRequest,
        listRequests,
        updateWorkflowExecutionArn,
        updateWorkflowTaskToken,
        setWorkflowExecutionArn,
        setWorkflowTaskToken,
    };
};
