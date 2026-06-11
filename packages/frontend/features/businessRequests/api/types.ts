import type {
    APPROVAL_ROLE_VALUES,
    APPROVAL_STEP_STATUS_VALUES,
    BUSINESS_REQUEST_DOMAIN_VALUES,
    BUSINESS_REQUEST_PRIORITY_VALUES,
    BUSINESS_REQUEST_STATUS_VALUES,
    BUSINESS_REQUEST_TYPE_VALUES,
} from "@/features/businessRequests/config"

export type BusinessRequestDomain = (typeof BUSINESS_REQUEST_DOMAIN_VALUES)[number]
export type BusinessRequestType = (typeof BUSINESS_REQUEST_TYPE_VALUES)[number]
export type BusinessRequestStatus = (typeof BUSINESS_REQUEST_STATUS_VALUES)[number]
export type BusinessRequestPriority = (typeof BUSINESS_REQUEST_PRIORITY_VALUES)[number]
export type ApprovalRole = (typeof APPROVAL_ROLE_VALUES)[number]
export type ApprovalStepStatus = (typeof APPROVAL_STEP_STATUS_VALUES)[number]

export type BusinessRequestUserSummary = {
    id: string
    email: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    groups?: string[]
}

export type BusinessRequestCustomerSummary = {
    id: string
    fullName: string
    companyName?: string | null
    assignedSalesUserId?: string | null
    assignedSalesUser?: BusinessRequestUserSummary | null
}

export type BusinessRequestSupplierSummary = {
    id: string
    name: string
    assignedPurchasingSuppliers?: BusinessRequestUserSummary[]
}

export type BusinessRequestItem = {
    id: string
    requestId: string
    productVariantId?: string | null
    quantity: number
    note?: string | null
    data?: Record<string, unknown> | null
    displayOrder: number
    productVariant?: {
        id: string
        fullCode: string
        versionCode: string
        name?: string | null
        product?: {
            id: string
            name: string
            code: string
            slug: string
            assets?: Array<{
                id: string
                url: string
                type?: string | null
                role?: string | null
            }>
            category?: {
                id: string
                name: string
            } | null
        } | null
    } | null
}

export type BusinessRequestApprovalStep = {
    id: string
    requestId: string
    stepOrder: number
    requiredRole: ApprovalRole
    assignedUserId?: string | null
    status: ApprovalStepStatus
    decidedByUserId?: string | null
    decidedAt?: string | null
    decisionNote?: string | null
    assignedUser?: BusinessRequestUserSummary | null
    decidedByUser?: BusinessRequestUserSummary | null
}

export type BusinessRequestActivityLog = {
    id: string
    requestId?: string | null
    actorUserId?: string | null
    source: string
    eventType: string
    title: string
    description?: string | null
    data?: Record<string, unknown> | null
    createdAt: string
    actorUser?: BusinessRequestUserSummary | null
}

export type BusinessRequest = {
    id: string
    domain: BusinessRequestDomain
    type: BusinessRequestType
    status: BusinessRequestStatus
    priority: BusinessRequestPriority
    title: string
    description?: string | null
    entityType?: string | null
    entityId?: string | null
    customerId?: string | null
    supplierId?: string | null
    requestedByUserId: string
    requesterRole: ApprovalRole
    workflowExecutionArn?: string | null
    requestedData?: Record<string, unknown> | null
    currentSnapshot?: Record<string, unknown> | null
    completedSnapshot?: Record<string, unknown> | null
    decidedAt?: string | null
    completedAt?: string | null
    cancelledAt?: string | null
    createdAt: string
    updatedAt: string
    customer?: BusinessRequestCustomerSummary | null
    supplier?: BusinessRequestSupplierSummary | null
    requestedByUser: BusinessRequestUserSummary
    items?: BusinessRequestItem[]
    approvalSteps?: BusinessRequestApprovalStep[]
    activityLogs?: BusinessRequestActivityLog[]
}

export type BusinessRequestListResponse = {
    statusCode: number
    payload: {
        data: BusinessRequest[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type BusinessRequestResponse = {
    statusCode: number
    payload: {
        request: BusinessRequest
    }
}

export type BusinessRequestDecisionResponse = {
    statusCode: number
    payload: {
        accepted: boolean
        request: BusinessRequest
    }
}

export type PortalBusinessRequestInput = {
    type: Extract<BusinessRequestType, "CUSTOMER_PROFILE_CHANGE" | "CUSTOMER_ORDER_REQUEST" | "CUSTOMER_DOCUMENT_REQUEST" | "CUSTOMER_PRICING_REQUEST">
    title?: string
    description?: string | null
    entityType?: string | null
    entityId?: string | null
    priority?: BusinessRequestPriority
    requestedData?: Record<string, unknown> | null
    items?: Array<{
        productVariantId?: string | null
        quantity?: number
        note?: string | null
        data?: Record<string, unknown> | null
    }>
}

export type ListBusinessRequestsParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: BusinessRequestStatus
    type?: BusinessRequestType
    domain?: BusinessRequestDomain
}

export type BusinessRequestListScope = "portal" | "supplier" | "sales" | "purchasing" | "admin"
export type BusinessRequestDecisionScope = "portal" | "sales" | "purchasing" | "admin"
export type BusinessRequestDecisionAction = "APPROVE" | "REJECT" | "COUNTER"

export type BusinessRequestCounterOfferItemInput = {
    requestItemId: string
    proposedUnitPrice: number
    currency?: string | null
}

export type BusinessRequestDecisionInput = {
    scope: BusinessRequestDecisionScope
    id: string
    action?: BusinessRequestDecisionAction
    approved?: boolean
    note?: string
    counterOfferItems?: BusinessRequestCounterOfferItemInput[]
}
