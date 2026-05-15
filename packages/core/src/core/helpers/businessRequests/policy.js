import createError from "http-errors";
export function getRequesterApprovalRole(user) {
    if (user.isOwner)
        return "OWNER";
    if (user.isAdmin)
        return "ADMIN";
    if (user.isSalesDirector)
        return "SALES_DIRECTOR";
    if (user.isSales)
        return "SALES";
    if (user.isPurchasing)
        return "PURCHASING";
    if (user.isSupplier)
        return "SUPPLIER";
    if (user.isCustomer)
        return "CUSTOMER";
    throw new createError.Forbidden("Requester role is not eligible for workflow requests");
}
export function getBusinessRequestDomain(type) {
    switch (type) {
        case "CUSTOMER_PROFILE_CHANGE":
        case "CUSTOMER_ORDER_REQUEST":
        case "CUSTOMER_DOCUMENT_REQUEST":
        case "CUSTOMER_PRICING_REQUEST":
        case "OFFER_DISCOUNT_REQUEST":
        case "PAYMENT_TERM_REQUEST":
            return "SALES";
        case "SUPPLIER_PROFILE_CHANGE":
        case "SUPPLIER_PRICING_CHANGE":
        case "SUPPLIER_CAPABILITY_CHANGE":
            return "PURCHASING";
        default:
            return "SALES";
    }
}
export function getBusinessRequestDefaultTitle(type) {
    switch (type) {
        case "CUSTOMER_PROFILE_CHANGE":
            return "Müşteri profil değişikliği talebi";
        case "CUSTOMER_ORDER_REQUEST":
            return "Müşteri sipariş talebi";
        case "CUSTOMER_DOCUMENT_REQUEST":
            return "Müşteri doküman talebi";
        case "CUSTOMER_PRICING_REQUEST":
            return "Müşteri fiyat talebi";
        case "SUPPLIER_PROFILE_CHANGE":
            return "Tedarikçi profil değişikliği talebi";
        case "SUPPLIER_PRICING_CHANGE":
            return "Tedarikçi fiyat değişikliği talebi";
        case "SUPPLIER_CAPABILITY_CHANGE":
            return "Tedarikçi yetkinlik değişikliği talebi";
        case "OFFER_DISCOUNT_REQUEST":
            return "İskonto onay talebi";
        case "PAYMENT_TERM_REQUEST":
            return "Vade değişikliği talebi";
        default:
            return "İş akışı talebi";
    }
}
export function buildApprovalSteps(input) {
    const steps = [];
    if (input.domain === "SALES") {
        if (input.requesterRole === "CUSTOMER") {
            if (input.customerAssignedSalesUserId) {
                steps.push({
                    stepOrder: steps.length + 1,
                    requiredRole: "SALES",
                    assignedUserId: input.customerAssignedSalesUserId,
                });
            }
            steps.push({
                stepOrder: steps.length + 1,
                requiredRole: "SALES_DIRECTOR",
            });
            steps.push({
                stepOrder: steps.length + 1,
                requiredRole: "ADMIN",
            });
            return steps;
        }
        if (input.requesterRole === "SALES") {
            steps.push({
                stepOrder: 1,
                requiredRole: "SALES_DIRECTOR",
            });
            steps.push({
                stepOrder: 2,
                requiredRole: "ADMIN",
            });
            return steps;
        }
        if (input.requesterRole === "SALES_DIRECTOR") {
            return [
                {
                    stepOrder: 1,
                    requiredRole: "ADMIN",
                },
            ];
        }
    }
    if (input.domain === "PURCHASING") {
        if (input.requesterRole === "SUPPLIER") {
            if (input.supplierAssignedPurchasingUserId) {
                steps.push({
                    stepOrder: steps.length + 1,
                    requiredRole: "PURCHASING",
                    assignedUserId: input.supplierAssignedPurchasingUserId,
                });
            }
            steps.push({
                stepOrder: steps.length + 1,
                requiredRole: "ADMIN",
            });
            return steps;
        }
        if (input.requesterRole === "PURCHASING") {
            return [
                {
                    stepOrder: 1,
                    requiredRole: "ADMIN",
                },
            ];
        }
    }
    return steps;
}
