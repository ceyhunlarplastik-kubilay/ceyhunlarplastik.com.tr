export type SupplierApprovalRequestType =
    | "SUPPLIER_PROFILE_UPDATE"
    | "VARIANT_PRICING_UPDATE"

export type SupplierApprovalRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"

export type SupplierApprovalRequest = {
    id: string
    type: SupplierApprovalRequestType
    status: SupplierApprovalRequestStatus
    supplierId: string
    productVariantSupplierId?: string | null
    requestedByUserId: string
    reviewedByUserId?: string | null
    workflowExecutionArn?: string | null
    requestPayload: Record<string, unknown>
    currentSnapshot?: Record<string, unknown> | null
    decisionNote?: string | null
    decidedAt?: string | null
    createdAt: string
    updatedAt: string
    supplier: {
        id: string
        name: string
    }
    requestedByUser: {
        id: string
        email: string
        identifier: string
    }
    reviewedByUser?: {
        id: string
        email: string
        identifier: string
    } | null
    productVariantSupplier?: {
        id: string
        currency?: string
        variant?: {
            id: string
            name: string
            fullCode: string
            product?: {
                id: string
                code: string
                name: string
            }
        }
    } | null
}

export type SupplierApprovalRequestResponse = {
    statusCode: number
    payload: {
        approvalRequest: SupplierApprovalRequest
    }
}

export type ListSupplierApprovalRequestsResponse = {
    statusCode: number
    payload: {
        data: SupplierApprovalRequest[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
