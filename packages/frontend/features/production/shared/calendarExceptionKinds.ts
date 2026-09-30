import type { CalendarExceptionKind } from "@core/helpers/production/productionCalendar"

export type { CalendarExceptionKind }

export const CALENDAR_EXCEPTION_KIND_OPTIONS: Array<{ value: CalendarExceptionKind; label: string; hint: string }> = [
    { value: "HOLIDAY", label: "Tatil / bayram", hint: "Resmî tatil ya da bayram: çalışılmaz." },
    { value: "SHUTDOWN", label: "Toplu izin", hint: "Fabrika ya da bölüm kapalı: çalışılmaz." },
    { value: "EXTRA_WORKDAY", label: "Ek mesai günü", hint: "Normalde çalışılmayan gün çalışılır (ör. Pazar)." },
]

export const CALENDAR_EXCEPTION_KIND_LABELS: Record<CalendarExceptionKind, string> = Object.fromEntries(
    CALENDAR_EXCEPTION_KIND_OPTIONS.map((option) => [option.value, option.label]),
) as Record<CalendarExceptionKind, string>

/** Rozet renkleri — renk tek başına bilgi taşımaz, etiket her zaman yazılır. */
export const CALENDAR_EXCEPTION_KIND_BADGE_CLASSES: Record<CalendarExceptionKind, string> = {
    HOLIDAY: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    SHUTDOWN: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    EXTRA_WORKDAY: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
}
