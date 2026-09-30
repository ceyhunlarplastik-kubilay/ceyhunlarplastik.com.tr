import type { CalendarExceptionKind } from "@/features/production/shared/calendarExceptionKinds"

type CodeNameRef = { id: string; code: string; name: string }

/** Tek GÜN kaydı; listede ardışık günler core `groupCalendarExceptionDays` ile birleştirilir. */
export type CalendarException = {
    id: string
    /** "YYYY-MM-DD" */
    date: string
    kind: CalendarExceptionKind
    note: string | null
    areaId: string | null
    area: CodeNameRef | null
    machineId: string | null
    machine: CodeNameRef | null
    createdAt: string
    updatedAt: string
}

/** Bir aralık; `replaceIds` doluysa düzenlemedir (o günler silinip yerine yazılır). */
export type CalendarExceptionEntryInput = {
    startDate: string
    endDate: string | null
    kind: CalendarExceptionKind
    note: string | null
    areaId: string | null
    machineId: string | null
    replaceIds?: string[]
}
