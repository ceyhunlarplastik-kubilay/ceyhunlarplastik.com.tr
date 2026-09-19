import createError from "http-errors"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

type CustomerLike = {
    id: string
    assignedSalesUserId?: string | null
}

type CustomerVisitAccessLike = CustomerLike & {
    status?: "LEAD" | "CUSTOMER"
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

/**
 * Ziyaretler VE portal daveti için ORTAK, `canManageCustomer`'dan daha gevşek
 * bir kural: potansiyel müşteriler (LEAD) sahiplenilmemiş açık bir havuzdur
 * (bkz. "Potansiyel Müşteriler" sayfası — hiçbir sales rep'e kilitli değil),
 * bu yüzden herhangi bir satış temsilcisi bir lead için saha ziyareti
 * planlayabilir VEYA portal daveti gönderebilir. Cari müşteriler (CUSTOMER)
 * için mevcut `assignedSalesUserId` kısıtı AYNEN geçerli kalır.
 */
function canManageOpenPoolLead(user: IAuthenticatedUser, customer: CustomerVisitAccessLike) {
    if (canManageCustomer(user, customer)) return true
    return user.isSales && customer.status === "LEAD"
}

/**
 * Yalnız ziyaret handler'ları kullanır — adres/özel fiyat/atanmış ürün gibi
 * diğer CRM uçları hâlâ `canManageCustomer`'a bağlı.
 */
export function canManageCustomerVisit(user: IAuthenticatedUser, customer: CustomerVisitAccessLike) {
    return canManageOpenPoolLead(user, customer)
}

export function assertCustomerVisitAccess(user: IAuthenticatedUser | undefined, customer: CustomerVisitAccessLike) {
    if (!user || !canManageCustomerVisit(user, customer)) {
        throw new createError.Forbidden("Customer visit access denied")
    }
}

/**
 * Yalnız satış panelinin "potansiyel müşteriyi portale davet et" ucu kullanır
 * — kural `canManageCustomerVisit` ile AYNI (LEAD açık havuz + CUSTOMER'da
 * atanmışlık şartı), ayrı fonksiyon olarak tutulur ki çağıran taraf hangi
 * işlem için yetki kontrolü yaptığını isimden okuyabilsin.
 */
export function canManageCustomerInvitation(user: IAuthenticatedUser, customer: CustomerVisitAccessLike) {
    return canManageOpenPoolLead(user, customer)
}

export function assertCustomerInvitationAccess(user: IAuthenticatedUser | undefined, customer: CustomerVisitAccessLike) {
    if (!user || !canManageCustomerInvitation(user, customer)) {
        throw new createError.Forbidden("Customer invitation access denied")
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
