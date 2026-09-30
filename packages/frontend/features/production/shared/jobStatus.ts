import type { ProductionJobStatus } from "@/features/production/orders/api/types"

export type { ProductionJobStatus }

/** Etiketler core durum makinesinde (sunucu mesajlarıyla aynı kaynak). */
export { JOB_STATUS_LABELS } from "@core/helpers/production/jobStateMachine"

/** Tahtadaki çubuk rengi — duruma göre (ürün rengi ayrı şerittir). Bağlama bloğu yalnız kenarlığı alır. */
export const JOB_STATUS_BORDER_CLASSES: Record<ProductionJobStatus, string> = {
    PLANNED: "border-sky-400 dark:border-sky-600",
    RELEASED: "border-indigo-400 dark:border-indigo-600",
    SETUP: "border-amber-400 dark:border-amber-600",
    RUNNING: "border-emerald-500 dark:border-emerald-600",
    PAUSED: "border-orange-400 dark:border-orange-600",
    COMPLETED: "border-border",
    CANCELLED: "border-border",
}

export const JOB_STATUS_FILL_CLASSES: Record<ProductionJobStatus, string> = {
    PLANNED: "bg-sky-200 dark:bg-sky-900/70",
    RELEASED: "bg-indigo-200 dark:bg-indigo-900/70",
    SETUP: "bg-amber-200 dark:bg-amber-900/70",
    RUNNING: "bg-emerald-200 dark:bg-emerald-900/70",
    PAUSED: "bg-orange-200 dark:bg-orange-900/70",
    COMPLETED: "bg-muted",
    CANCELLED: "bg-muted",
}
