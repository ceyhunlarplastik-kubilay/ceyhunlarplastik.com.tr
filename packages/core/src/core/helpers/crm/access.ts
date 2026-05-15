import createError from "http-errors"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

type CustomerLike = {
    id: string
    assignedSalesUserId?: string | null
}

type SupplierLike = {
    id: string
    assignedPurchasingSuppliers?: Array<{
        id: string
    }>
}

export function canManageCustomer(user: IAuthenticatedUser, customer: CustomerLike) {
    if (user.isOwner || user.isAdmin) return true
    if (user.isSalesDirector) return true
    return user.isSales && customer.assignedSalesUserId === user.id
}

export function assertCustomerManagementAccess(user: IAuthenticatedUser | undefined, customer: CustomerLike) {
    if (!user || !canManageCustomer(user, customer)) {
        throw new createError.Forbidden("Customer access denied")
    }
}

export function canManageSupplier(user: IAuthenticatedUser, supplier: SupplierLike) {
    if (user.isOwner || user.isAdmin) return true
    return user.isPurchasing && (supplier.assignedPurchasingSuppliers ?? []).some((assignedUser) => assignedUser.id === user.id)
}

export function assertSupplierManagementAccess(user: IAuthenticatedUser | undefined, supplier: SupplierLike) {
    if (!user || !canManageSupplier(user, supplier)) {
        throw new createError.Forbidden("Supplier access denied")
    }
}

export function assertCustomerPortalAccess(user: IAuthenticatedUser | undefined, customerId: string) {
    if (!user) {
        throw new createError.Unauthorized("Authentication required")
    }

    if (user.isOwner || user.isAdmin) return

    if (!user.isCustomer || user.customerId !== customerId) {
        throw new createError.Forbidden("Customer portal access denied")
    }
}
