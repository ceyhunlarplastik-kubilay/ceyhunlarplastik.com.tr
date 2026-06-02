export const ORDER_STATUS_VALUES = [
    "APPROVED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
] as const

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUS_VALUES)[number], string> = {
    APPROVED: "Onaylandı",
    IN_PRODUCTION: "Üretimde",
    READY_TO_SHIP: "Sevke Hazır",
    SHIPPED: "Sevk Edildi",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
}

export const DEFAULT_ORDER_PAGE_SIZE = 20
