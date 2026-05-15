export const BUSINESS_REQUEST_STATUS_VALUES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
    "FAILED",
] as const

export const BUSINESS_REQUEST_TYPE_VALUES = [
    "CUSTOMER_PROFILE_CHANGE",
    "CUSTOMER_ORDER_REQUEST",
    "CUSTOMER_DOCUMENT_REQUEST",
    "CUSTOMER_PRICING_REQUEST",
    "SUPPLIER_PROFILE_CHANGE",
    "SUPPLIER_PRICING_CHANGE",
    "SUPPLIER_CAPABILITY_CHANGE",
    "SUPPLIER_CATEGORY_CREATE",
    "SUPPLIER_PRODUCT_CREATE",
    "SUPPLIER_VARIANT_CREATE",
    "OFFER_DISCOUNT_REQUEST",
    "PAYMENT_TERM_REQUEST",
] as const

export const BUSINESS_REQUEST_DOMAIN_VALUES = ["SALES", "PURCHASING"] as const
export const BUSINESS_REQUEST_PRIORITY_VALUES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const
export const APPROVAL_ROLE_VALUES = ["CUSTOMER", "SUPPLIER", "SALES", "SALES_DIRECTOR", "PURCHASING", "ADMIN", "OWNER"] as const
export const APPROVAL_STEP_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "SKIPPED"] as const

export const CUSTOMER_PORTAL_REQUEST_TYPES = [
    "CUSTOMER_PROFILE_CHANGE",
    "CUSTOMER_ORDER_REQUEST",
    "CUSTOMER_DOCUMENT_REQUEST",
    "CUSTOMER_PRICING_REQUEST",
] as const

export const BUSINESS_REQUEST_TYPE_LABELS: Record<(typeof BUSINESS_REQUEST_TYPE_VALUES)[number], string> = {
    CUSTOMER_PROFILE_CHANGE: "Profil Değişikliği",
    CUSTOMER_ORDER_REQUEST: "Sipariş Talebi",
    CUSTOMER_DOCUMENT_REQUEST: "Doküman Talebi",
    CUSTOMER_PRICING_REQUEST: "Fiyat Talebi",
    SUPPLIER_PROFILE_CHANGE: "Tedarikçi Profil Değişikliği",
    SUPPLIER_PRICING_CHANGE: "Tedarikçi Fiyat Değişikliği",
    SUPPLIER_CAPABILITY_CHANGE: "Tedarikçi Yetkinlik Değişikliği",
    SUPPLIER_CATEGORY_CREATE: "Tedarikçi Kategori Talebi",
    SUPPLIER_PRODUCT_CREATE: "Tedarikçi Ürün Talebi",
    SUPPLIER_VARIANT_CREATE: "Tedarikçi Varyant Talebi",
    OFFER_DISCOUNT_REQUEST: "İskonto Talebi",
    PAYMENT_TERM_REQUEST: "Vade Talebi",
}

export const BUSINESS_REQUEST_STATUS_LABELS: Record<(typeof BUSINESS_REQUEST_STATUS_VALUES)[number], string> = {
    DRAFT: "Taslak",
    PENDING_APPROVAL: "Onay Bekliyor",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
    CANCELLED: "İptal Edildi",
    COMPLETED: "Tamamlandı",
    FAILED: "Başarısız",
}

export const BUSINESS_REQUEST_DOMAIN_LABELS: Record<(typeof BUSINESS_REQUEST_DOMAIN_VALUES)[number], string> = {
    SALES: "Satış",
    PURCHASING: "Satın Alma",
}

export const BUSINESS_REQUEST_PRIORITY_LABELS: Record<(typeof BUSINESS_REQUEST_PRIORITY_VALUES)[number], string> = {
    LOW: "Düşük",
    NORMAL: "Normal",
    HIGH: "Yüksek",
    URGENT: "Acil",
}

export const APPROVAL_ROLE_LABELS: Record<(typeof APPROVAL_ROLE_VALUES)[number], string> = {
    CUSTOMER: "Müşteri",
    SUPPLIER: "Tedarikçi",
    SALES: "Satış",
    SALES_DIRECTOR: "Satış Direktörü",
    PURCHASING: "Satın Alma",
    ADMIN: "Admin",
    OWNER: "Owner",
}

export const APPROVAL_STEP_STATUS_LABELS: Record<(typeof APPROVAL_STEP_STATUS_VALUES)[number], string> = {
    PENDING: "Bekliyor",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
    SKIPPED: "Atlandı",
}

export const DEFAULT_BUSINESS_REQUEST_PAGE_SIZE = 20
export const DEFAULT_BUSINESS_REQUEST_REFRESH_INTERVAL_SECONDS = 30

export function normalizeBusinessRequestRefreshInterval(value: number) {
    if (!Number.isFinite(value) || value <= 0) return 0
    if (value < 15) return 15
    if (value > 300) return 300
    return Math.round(value)
}
