import type { BusinessRequest } from "@/features/businessRequests/api/types"

export type BusinessRequestUserContext = {
    dbUserId?: string | null
    customerId?: string | null
    groups?: string[]
}

export function getCurrentPendingStep(request: BusinessRequest) {
    return request.approvalSteps?.find((step) => step.status === "PENDING") ?? null
}

export function canCurrentUserDecideRequest(
    request: BusinessRequest,
    user: BusinessRequestUserContext | undefined,
) {
    const currentStep = getCurrentPendingStep(request)
    if (!currentStep || !user) return false

    const groups = user.groups ?? []
    const dbUserId = user.dbUserId ?? undefined

    if (groups.includes("owner") || groups.includes("admin")) return true

    if (groups.includes("customer")) {
        return currentStep.requiredRole === "CUSTOMER" && request.customerId === user.customerId
    }

    if (request.domain === "SALES") {
        if (groups.includes("sales_director")) {
            return currentStep.requiredRole === "SALES" || currentStep.requiredRole === "SALES_DIRECTOR"
        }

        if (groups.includes("sales")) {
            return (
                currentStep.requiredRole === "SALES"
                && (!currentStep.assignedUserId || currentStep.assignedUserId === dbUserId)
                && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === dbUserId)
            )
        }
    }

    if (request.domain === "PURCHASING" && groups.includes("purchasing")) {
        return (
            currentStep.requiredRole === "PURCHASING"
            && (!currentStep.assignedUserId || currentStep.assignedUserId === dbUserId)
            && (request.supplier?.assignedPurchasingSuppliers ?? []).some((assignedUser) => assignedUser.id === dbUserId)
        )
    }

    return false
}

export function canCurrentUserSendCounterOffer(
    request: BusinessRequest,
    user: BusinessRequestUserContext | undefined,
) {
    if (!canCurrentUserDecideRequest(request, user)) return false

    return request.domain === "SALES"
        && (request.type === "CUSTOMER_ORDER_REQUEST" || request.type === "CUSTOMER_PRICING_REQUEST")
        && !user?.groups?.includes("customer")
        && (request.items?.length ?? 0) > 0
}
