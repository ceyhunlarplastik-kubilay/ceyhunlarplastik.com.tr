export const SUPPLIER_APPROVAL_REQUEST_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED"] as const
export const SUPPLIER_APPROVAL_REQUEST_TYPE_VALUES = [
    "SUPPLIER_PROFILE_UPDATE",
    "VARIANT_PRICING_UPDATE",
] as const
export const SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS = [0, 10, 15, 30, 60] as const
export const DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS = 60
export const DEFAULT_SUPPLIER_APPROVAL_REQUEST_PAGE_SIZE = 20

export const SUPPLIER_APPROVAL_STATUS_LABELS: Record<string, string> = {
    PENDING: "Bekliyor",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
}

export const SUPPLIER_APPROVAL_STATUS_BADGE_CLASSES: Record<string, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
}

export const SUPPLIER_APPROVAL_TYPE_LABELS: Record<string, string> = {
    SUPPLIER_PROFILE_UPDATE: "Profil Güncellemesi",
    VARIANT_PRICING_UPDATE: "Varyant Fiyatı",
}

export function normalizeSupplierApprovalRefreshInterval(seconds: number | null | undefined) {
    return SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS.includes(
        seconds as (typeof SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS)[number]
    )
        ? seconds!
        : DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS
}
