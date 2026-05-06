export const SUPPLIER_APPROVAL_REQUEST_TYPES = {
    SUPPLIER_PROFILE_UPDATE: "SUPPLIER_PROFILE_UPDATE",
    VARIANT_PRICING_UPDATE: "VARIANT_PRICING_UPDATE",
} as const

export const SUPPLIER_APPROVAL_REQUEST_STATUSES = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const

export type SupplierApprovalRequestType =
    (typeof SUPPLIER_APPROVAL_REQUEST_TYPES)[keyof typeof SUPPLIER_APPROVAL_REQUEST_TYPES]

export type SupplierApprovalRequestStatus =
    (typeof SUPPLIER_APPROVAL_REQUEST_STATUSES)[keyof typeof SUPPLIER_APPROVAL_REQUEST_STATUSES]

export type SupplierProfileApprovalPayload = {
    name?: string
    contactName?: string
    phone?: string
    address?: string
    taxNumber?: string
    defaultPaymentTermDays?: number
}

export type SupplierVariantPricingApprovalPayload = {
    price: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
    paymentTermDays?: number
    supplierVariantCode?: string
    supplierNote?: string
    minOrderQty?: number
    stockQty?: number
    currency?: string
}

export type SupplierApprovalRequestPayload =
    | SupplierProfileApprovalPayload
    | SupplierVariantPricingApprovalPayload
