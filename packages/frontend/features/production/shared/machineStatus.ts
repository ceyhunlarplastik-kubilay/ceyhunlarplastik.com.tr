export type ProductionMachineStatus = "ACTIVE" | "MAINTENANCE" | "BREAKDOWN" | "INACTIVE"

export const MACHINE_STATUS_OPTIONS: Array<{ value: ProductionMachineStatus; label: string }> = [
    { value: "ACTIVE", label: "Aktif" },
    { value: "MAINTENANCE", label: "Bakımda" },
    { value: "BREAKDOWN", label: "Arızalı" },
    { value: "INACTIVE", label: "Kullanım dışı" },
]

export const MACHINE_STATUS_LABELS: Record<ProductionMachineStatus, string> = Object.fromEntries(
    MACHINE_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ProductionMachineStatus, string>

/** Durum rozetinin renkleri — renk tek başına bilgi taşımaz, etiket her zaman yazılır. */
export const MACHINE_STATUS_BADGE_CLASSES: Record<ProductionMachineStatus, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    BREAKDOWN: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    INACTIVE: "border-border bg-muted text-muted-foreground",
}
