import { prisma } from "@/core/db/prisma"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type {
    ApprovalRole,
    ApprovalStepStatus,
    BusinessRequestDomain,
    BusinessRequestStatus,
    BusinessRequestType,
    Prisma,
} from "@/prisma/generated/prisma/client"

export const businessRequestInclude = {
    customer: {
        select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
            phone: true,
            assignedSalesUserId: true,
            generalDiscountPercent: true,
            defaultPaymentTermDays: true,
            paymentTermNote: true,
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
    supplier: {
        select: {
            id: true,
            name: true,
            assignedPurchasingSuppliers: {
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
                    firstName: true,
                    lastName: true,
                    groups: true,
                },
            },
            decidedByUser: {
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
                    firstName: true,
                    lastName: true,
                    groups: true,
                },
            },
        },
    },
} satisfies Prisma.BusinessRequestInclude

export type BusinessRequestWithRelations = Prisma.BusinessRequestGetPayload<{
    include: typeof businessRequestInclude
}>

export type BusinessRequestApprovalStepWithRelations = BusinessRequestWithRelations["approvalSteps"][number]

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
} satisfies Prisma.BusinessRequestSelect

export type BusinessRequestWorkflowRecord = Prisma.BusinessRequestGetPayload<{
    select: typeof businessRequestWorkflowSelect
}>

export interface IPrismaBusinessRequestRepository {
    createRequest(data: Prisma.BusinessRequestCreateInput): Promise<BusinessRequestWithRelations>
    deleteRequest(id: string): Promise<void>
    getRequest(id: string): Promise<BusinessRequestWithRelations | null>
    getWorkflowRequest(id: string): Promise<BusinessRequestWorkflowRecord | null>
    listRequests(query: IPaginationQuery & {
        domain?: BusinessRequestDomain
        status?: BusinessRequestStatus
        type?: BusinessRequestType
        requestedByUserId?: string
        customerId?: string
        supplierId?: string
        customerAssignedSalesUserId?: string
        supplierAssignedPurchasingUserId?: string
        requiredRole?: ApprovalRole
        assignedUserId?: string
        stepStatus?: ApprovalStepStatus
    }): Promise<{
        data: BusinessRequestWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    updateWorkflowExecutionArn(id: string, workflowExecutionArn: string): Promise<BusinessRequestWithRelations>
    updateWorkflowTaskToken(id: string, workflowTaskToken: string | null): Promise<BusinessRequestWithRelations>
    setWorkflowExecutionArn(id: string, workflowExecutionArn: string): Promise<void>
    setWorkflowTaskToken(id: string, workflowTaskToken: string | null): Promise<void>
}

export const businessRequestRepository = (): IPrismaBusinessRequestRepository => {
    const createRequest = (data: Prisma.BusinessRequestCreateInput) =>
        prisma.businessRequest.create({
            data,
            include: businessRequestInclude,
        })

    const deleteRequest = async (id: string) => {
        await prisma.businessRequest.delete({
            where: { id },
        })
    }

    const getRequest = (id: string) =>
        prisma.businessRequest.findUnique({
            where: { id },
            include: businessRequestInclude,
        })

    const getWorkflowRequest = (id: string) =>
        prisma.businessRequest.findUnique({
            where: { id },
            select: businessRequestWorkflowSelect,
        })

    const listRequests = async (query: IPaginationQuery & {
        domain?: BusinessRequestDomain
        status?: BusinessRequestStatus
        type?: BusinessRequestType
        requestedByUserId?: string
        customerId?: string
        supplierId?: string
        customerAssignedSalesUserId?: string
        supplierAssignedPurchasingUserId?: string
        requiredRole?: ApprovalRole
        assignedUserId?: string
        stepStatus?: ApprovalStepStatus
    }) => {
        const page = query.page && query.page > 0 ? query.page : 1
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
        const skip = (page - 1) * limit
        const order = query.order === "asc" ? "asc" : "desc"
        const allowedSortFields = new Set(["createdAt", "updatedAt", "decidedAt", "completedAt", "status", "type"])
        const sortField = allowedSortFields.has(query.sort ?? "") ? query.sort! : "createdAt"

        const where: Prisma.BusinessRequestWhereInput = {
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
                        assignedPurchasingSuppliers: {
                            some: {
                                id: query.supplierAssignedPurchasingUserId,
                            },
                        },
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
        }

        const [data, total] = await Promise.all([
            prisma.businessRequest.findMany({
                where,
                include: businessRequestInclude,
                orderBy: { [sortField]: order },
                skip,
                take: limit,
            }),
            prisma.businessRequest.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const updateWorkflowExecutionArn = (id: string, workflowExecutionArn: string) =>
        prisma.businessRequest.update({
            where: { id },
            data: { workflowExecutionArn },
            include: businessRequestInclude,
        })

    const updateWorkflowTaskToken = (id: string, workflowTaskToken: string | null) =>
        prisma.businessRequest.update({
            where: { id },
            data: { workflowTaskToken },
            include: businessRequestInclude,
        })

    const setWorkflowExecutionArn = async (id: string, workflowExecutionArn: string) => {
        await prisma.businessRequest.update({
            where: { id },
            data: { workflowExecutionArn },
            select: { id: true },
        })
    }

    const setWorkflowTaskToken = async (id: string, workflowTaskToken: string | null) => {
        await prisma.businessRequest.update({
            where: { id },
            data: { workflowTaskToken },
            select: { id: true },
        })
    }

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
    }
}
