import { prisma } from "@/core/db/prisma"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import {
    Prisma,
    SupplierApprovalRequestStatus,
    SupplierApprovalRequestType,
} from "@/prisma/generated/prisma/client"

export type SupplierApprovalRequestWithRelations = Prisma.SupplierApprovalRequestGetPayload<{
    include: {
        supplier: true
        requestedByUser: {
            select: {
                id: true
                email: true
                identifier: true
            }
        }
        reviewedByUser: {
            select: {
                id: true
                email: true
                identifier: true
            }
        }
        productVariantSupplier: {
            include: {
                supplier: true
                variant: {
                    include: {
                        product: {
                            include: {
                                category: true
                                assets: true
                            }
                        }
                    }
                }
            }
        }
    }
}>

export interface IPrismaSupplierApprovalRequestRepository {
    createApprovalRequest(data: Prisma.SupplierApprovalRequestCreateInput): Promise<SupplierApprovalRequestWithRelations>
    deleteApprovalRequest(id: string): Promise<void>
    getApprovalRequest(id: string): Promise<SupplierApprovalRequestWithRelations | null>
    updateWorkflowExecutionArn(id: string, workflowExecutionArn: string): Promise<SupplierApprovalRequestWithRelations>
    updateWorkflowTaskToken(id: string, workflowTaskToken: string): Promise<SupplierApprovalRequestWithRelations>
    resolveApprovalRequest(
        id: string,
        data: {
            status: "APPROVED" | "REJECTED"
            reviewedByUserId: string
            decisionNote?: string | null
            decidedAt?: Date
        }
    ): Promise<SupplierApprovalRequestWithRelations>
    findPendingApprovalRequest(input: {
        type: "SUPPLIER_PROFILE_UPDATE" | "VARIANT_PRICING_UPDATE"
        supplierId: string
        productVariantSupplierId?: string
    }): Promise<SupplierApprovalRequestWithRelations | null>
    listApprovalRequests(query: IPaginationQuery & {
        status?: string
        type?: string
        supplierId?: string
        requestedByUserId?: string
    }): Promise<{
        data: SupplierApprovalRequestWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
}

const approvalRequestInclude = {
    supplier: true,
    requestedByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
        },
    },
    reviewedByUser: {
        select: {
            id: true,
            email: true,
            identifier: true,
        },
    },
    productVariantSupplier: {
        include: {
            supplier: true,
            variant: {
                include: {
                    product: {
                        include: {
                            category: true,
                            assets: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.SupplierApprovalRequestInclude

export const supplierApprovalRequestRepository = (): IPrismaSupplierApprovalRequestRepository => {
    const createApprovalRequest = (data: Prisma.SupplierApprovalRequestCreateInput) =>
        prisma.supplierApprovalRequest.create({
            data,
            include: approvalRequestInclude,
        })

    const deleteApprovalRequest = async (id: string) => {
        await prisma.supplierApprovalRequest.delete({
            where: { id },
        })
    }

    const getApprovalRequest = (id: string) =>
        prisma.supplierApprovalRequest.findUnique({
            where: { id },
            include: approvalRequestInclude,
        })

    const updateWorkflowExecutionArn = (id: string, workflowExecutionArn: string) =>
        prisma.supplierApprovalRequest.update({
            where: { id },
            data: { workflowExecutionArn },
            include: approvalRequestInclude,
        })

    const updateWorkflowTaskToken = (id: string, workflowTaskToken: string) =>
        prisma.supplierApprovalRequest.update({
            where: { id },
            data: { workflowTaskToken },
            include: approvalRequestInclude,
        })

    const resolveApprovalRequest = (
        id: string,
        data: {
            status: "APPROVED" | "REJECTED"
            reviewedByUserId: string
            decisionNote?: string | null
            decidedAt?: Date
        }
    ) =>
        prisma.supplierApprovalRequest.update({
            where: { id },
            data: {
                status: data.status,
                reviewedByUser: {
                    connect: {
                        id: data.reviewedByUserId,
                    },
                },
                decisionNote: data.decisionNote ?? null,
                decidedAt: data.decidedAt ?? new Date(),
                workflowTaskToken: null,
            },
            include: approvalRequestInclude,
        })

    const findPendingApprovalRequest = (input: {
        type: "SUPPLIER_PROFILE_UPDATE" | "VARIANT_PRICING_UPDATE"
        supplierId: string
        productVariantSupplierId?: string
    }) =>
        prisma.supplierApprovalRequest.findFirst({
            where: {
                type: input.type,
                status: "PENDING",
                supplierId: input.supplierId,
                ...(input.productVariantSupplierId
                    ? { productVariantSupplierId: input.productVariantSupplierId }
                    : { productVariantSupplierId: null }),
            },
            include: approvalRequestInclude,
            orderBy: { createdAt: "desc" },
        })

    const listApprovalRequests = async (query: IPaginationQuery & {
        status?: string
        type?: string
        supplierId?: string
        requestedByUserId?: string
    }) => {
        const page = query.page && query.page > 0 ? query.page : 1
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
        const skip = (page - 1) * limit
        const order = query.order === "asc" ? "asc" : "desc"
        const allowedSortFields = new Set(["createdAt", "updatedAt", "decidedAt", "status", "type"])
        const sortField = allowedSortFields.has(query.sort ?? "") ? query.sort! : "createdAt"

        const where: Prisma.SupplierApprovalRequestWhereInput = {
            ...(query.status ? { status: query.status as SupplierApprovalRequestStatus } : {}),
            ...(query.type ? { type: query.type as SupplierApprovalRequestType } : {}),
            ...(query.supplierId ? { supplierId: query.supplierId } : {}),
            ...(query.requestedByUserId ? { requestedByUserId: query.requestedByUserId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { supplier: { name: { contains: query.search, mode: "insensitive" } } },
                        { requestedByUser: { email: { contains: query.search, mode: "insensitive" } } },
                        { productVariantSupplier: { variant: { name: { contains: query.search, mode: "insensitive" } } } },
                        { productVariantSupplier: { variant: { fullCode: { contains: query.search, mode: "insensitive" } } } },
                    ],
                }
                : {}),
        }

        const [data, total] = await Promise.all([
            prisma.supplierApprovalRequest.findMany({
                where,
                include: approvalRequestInclude,
                orderBy: { [sortField]: order },
                skip,
                take: limit,
            }),
            prisma.supplierApprovalRequest.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    return {
        createApprovalRequest,
        deleteApprovalRequest,
        getApprovalRequest,
        updateWorkflowExecutionArn,
        updateWorkflowTaskToken,
        resolveApprovalRequest,
        findPendingApprovalRequest,
        listApprovalRequests,
    }
}
