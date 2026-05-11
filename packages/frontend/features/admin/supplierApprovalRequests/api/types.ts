export type AdminSupplierApprovalRequestType =
    | "SUPPLIER_PROFILE_UPDATE"
    | "VARIANT_PRICING_UPDATE"

export type AdminSupplierApprovalRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"

export type AdminSupplierApprovalRequest = {
    id: string
    type: AdminSupplierApprovalRequestType
    status: AdminSupplierApprovalRequestStatus
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
                slug: string
                description?: string | null
                assets?: Array<{
                    id: string
                    key: string
                    role: string
                    type: string
                    url: string
                }>
            }
        }
    } | null
}

export type AdminSupplierApprovalRequestListResponse = {
    statusCode: number
    payload: {
        data: AdminSupplierApprovalRequest[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type DecideSupplierApprovalRequestResponse = {
    statusCode: number
    payload: {
        accepted: boolean
        approvalRequest?: AdminSupplierApprovalRequest | null
    }
}
