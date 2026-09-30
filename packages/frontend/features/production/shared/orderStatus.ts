import type {
    ProductionOrderSource,
    ProductionOrderStatus,
    ProductionPriority,
} from "@/features/production/orders/api/types"

export const ORDER_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
    DRAFT: "Taslak",
    PLANNED: "Planlandı",
    RELEASED: "Sahaya verildi",
    IN_PROGRESS: "Üretimde",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
    ON_HOLD: "Beklemede",
}

/** Rozet renkleri — renk tek başına bilgi taşımaz, etiket her zaman yazılır. */
export const ORDER_STATUS_BADGE_CLASSES: Record<ProductionOrderStatus, string> = {
    DRAFT: "border-border bg-muted text-foreground",
    PLANNED: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    RELEASED: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300",
    IN_PROGRESS: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    COMPLETED: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    CANCELLED: "border-border bg-muted text-muted-foreground line-through",
    ON_HOLD: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

/** Liste filtresi: "open" (varsayılan), "all" ya da tek durum. */
export const ORDER_STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "open", label: "Açık emirler" },
    { value: "all", label: "Tümü" },
    ...(Object.entries(ORDER_STATUS_LABELS) as Array<[ProductionOrderStatus, string]>)
        .map(([value, label]) => ({ value, label })),
]

export const PRIORITY_OPTIONS: Array<{ value: ProductionPriority; label: string }> = [
    { value: "LOW", label: "Düşük" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "Yüksek" },
    { value: "URGENT", label: "Acil" },
]

export const PRIORITY_LABELS = Object.fromEntries(
    PRIORITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductionPriority, string>

export const PRIORITY_BADGE_CLASSES: Record<ProductionPriority, string> = {
    LOW: "border-border bg-muted text-muted-foreground",
    NORMAL: "border-border bg-background text-foreground",
    HIGH: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    URGENT: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

export const SOURCE_OPTIONS: Array<{ value: ProductionOrderSource; label: string }> = [
    { value: "MANUAL", label: "Elle" },
    { value: "STOCK", label: "Stok için" },
    { value: "CUSTOMER_ORDER", label: "Müşteri siparişi" },
]

export const SOURCE_LABELS = Object.fromEntries(
    SOURCE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductionOrderSource, string>
