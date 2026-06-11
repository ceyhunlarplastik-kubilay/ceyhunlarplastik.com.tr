import type { BusinessRequest, BusinessRequestItem } from "@/features/businessRequests/api/types"

export function isSupplierDiffRequest(request: BusinessRequest) {
    return request.type === "SUPPLIER_PROFILE_CHANGE"
        || request.type === "SUPPLIER_PRICING_CHANGE"
        || request.type === "SUPPLIER_CATEGORY_CREATE"
        || request.type === "SUPPLIER_PRODUCT_CREATE"
        || request.type === "SUPPLIER_VARIANT_CREATE"
}

export function isDiffRequest(request: BusinessRequest) {
    return isSupplierDiffRequest(request) || request.type === "CUSTOMER_PROFILE_CHANGE"
}

export function getBusinessRequestTableColSpan(showDomain: boolean, showRequester: boolean) {
    return showDomain ? (showRequester ? 7 : 6) : (showRequester ? 6 : 5)
}

export function getSubjectLabel(request: BusinessRequest) {
    if (request.customer) return request.customer.companyName || request.customer.fullName
    if (request.supplier) return request.supplier.name
    if ((request.items?.length ?? 0) > 0) {
        return `${request.items?.length ?? 0} varyant satırı`
    }
    return request.entityType || "-"
}

export function getBusinessRequestItemTitle(item: BusinessRequestItem) {
    return item.productVariant?.product?.name ?? "Varyant kalemi"
}

export function getBusinessRequestItemReference(item: BusinessRequestItem) {
    return item.productVariant?.fullCode
        ?? (typeof item.data?.variantFullCode === "string"
            ? item.data.variantFullCode
            : typeof item.data?.variantKey === "string"
                ? item.data.variantKey
                : "-")
}
