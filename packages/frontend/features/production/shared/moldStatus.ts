export type MoldStatus = "ACTIVE" | "IN_MAINTENANCE" | "BROKEN" | "RETIRED"
export type MoldOwnership = "COMPANY" | "CUSTOMER"

export const MOLD_STATUS_OPTIONS: Array<{ value: MoldStatus; label: string }> = [
    { value: "ACTIVE", label: "Kullanımda" },
    { value: "IN_MAINTENANCE", label: "Bakımda" },
    { value: "BROKEN", label: "Arızalı" },
    { value: "RETIRED", label: "Kullanım dışı" },
]

export const MOLD_STATUS_LABELS: Record<MoldStatus, string> = Object.fromEntries(
    MOLD_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<MoldStatus, string>

/** Durum rozeti renkleri — etiket her zaman yazılır, renk tek başına bilgi taşımaz. */
export const MOLD_STATUS_BADGE_CLASSES: Record<MoldStatus, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    IN_MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    BROKEN: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    RETIRED: "border-border bg-muted text-muted-foreground",
}

export const MOLD_OWNERSHIP_OPTIONS: Array<{ value: MoldOwnership; label: string }> = [
    { value: "COMPANY", label: "Şirket kalıbı" },
    { value: "CUSTOMER", label: "Müşteri kalıbı" },
]
