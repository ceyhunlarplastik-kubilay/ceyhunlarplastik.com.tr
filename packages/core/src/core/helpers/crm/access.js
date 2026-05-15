import createError from "http-errors";
export function canManageCustomer(user, customer) {
    if (user.isOwner || user.isAdmin)
        return true;
    if (user.isSalesDirector)
        return true;
    return user.isSales && customer.assignedSalesUserId === user.id;
}
export function assertCustomerManagementAccess(user, customer) {
    if (!user || !canManageCustomer(user, customer)) {
        throw new createError.Forbidden("Customer access denied");
    }
}
export function canManageSupplier(user, supplier) {
    if (user.isOwner || user.isAdmin)
        return true;
    return user.isPurchasing && supplier.assignedPurchasingUserId === user.id;
}
export function assertSupplierManagementAccess(user, supplier) {
    if (!user || !canManageSupplier(user, supplier)) {
        throw new createError.Forbidden("Supplier access denied");
    }
}
export function assertCustomerPortalAccess(user, customerId) {
    if (!user) {
        throw new createError.Unauthorized("Authentication required");
    }
    if (user.isOwner || user.isAdmin)
        return;
    if (!user.isCustomer || user.customerId !== customerId) {
        throw new createError.Forbidden("Customer portal access denied");
    }
}
