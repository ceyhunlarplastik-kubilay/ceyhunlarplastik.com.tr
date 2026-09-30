export type MachineDowntimeKind = "PLANNED_MAINTENANCE" | "BREAKDOWN" | "OTHER"

export const DOWNTIME_KIND_OPTIONS: Array<{ value: MachineDowntimeKind; label: string }> = [
    { value: "PLANNED_MAINTENANCE", label: "Planlı bakım" },
    { value: "BREAKDOWN", label: "Arıza" },
    { value: "OTHER", label: "Diğer" },
]

export const DOWNTIME_KIND_LABELS: Record<MachineDowntimeKind, string> = Object.fromEntries(
    DOWNTIME_KIND_OPTIONS.map((option) => [option.value, option.label]),
) as Record<MachineDowntimeKind, string>

/** Rozet renkleri — renk tek başına bilgi taşımaz, etiket her zaman yazılır. */
export const DOWNTIME_KIND_BADGE_CLASSES: Record<MachineDowntimeKind, string> = {
    PLANNED_MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    BREAKDOWN: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    OTHER: "border-border bg-muted text-muted-foreground",
}
