import { z } from "zod"

import {
    calendarExceptionScopeKey,
    enumerateDateKeys,
    findCalendarExceptionIssues,
    formatDateKey,
    weekdayOfDateKey,
    type CalendarExceptionGroup,
    type CalendarExceptionIssueCode,
    type CalendarExceptionScope,
} from "@core/helpers/production/productionCalendar"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import type { CalendarException, CalendarExceptionEntryInput } from "@/features/production/calendar/api/types"

/**
 * Takvim kaydı formu. Kapsam TEK seçimdir ve değeri core `calendarExceptionScopeKey`
 * biçimindedir: "factory" · "area:<id>" · "machine:<id>". Tarih ve kapsam kuralları
 * sunucudakiyle AYNI fonksiyon (`findCalendarExceptionIssues`).
 */

export const FACTORY_SCOPE = "factory"

export function parseScopeValue(value: string): CalendarExceptionScope {
    const separator = value.indexOf(":")
    const type = separator === -1 ? value : value.slice(0, separator)
    const id = separator === -1 ? "" : value.slice(separator + 1)

    if (type === "area" && id) return { areaId: id, machineId: null }
    if (type === "machine" && id) return { areaId: null, machineId: id }
    return { areaId: null, machineId: null }
}

const ISSUE_FIELDS: Record<CalendarExceptionIssueCode, "startDate" | "endDate" | "scope"> = {
    INVALID_START: "startDate",
    INVALID_END: "endDate",
    END_BEFORE_START: "endDate",
    TOO_LONG: "endDate",
    AMBIGUOUS_SCOPE: "scope",
}

export const calendarExceptionFormSchema = z.object({
    kind: z.enum(["HOLIDAY", "SHUTDOWN", "EXTRA_WORKDAY"]),
    /** `<input type="date">`: "YYYY-MM-DD". */
    startDate: z.string().min(1, "Başlangıç tarihi zorunlu"),
    /** Boş = tek günlük kayıt. */
    endDate: z.string(),
    scope: z.string().min(1, "Kapsam seçin"),
    note: z.string().trim().max(160, "En fazla 160 karakter"),
}).superRefine((values, ctx) => {
    if (!values.startDate) return
    const scope = parseScopeValue(values.scope)
    for (const issue of findCalendarExceptionIssues({ ...scope, startDate: values.startDate, endDate: values.endDate || null })) {
        ctx.addIssue({ code: "custom", path: [ISSUE_FIELDS[issue.code]], message: issue.message })
    }
})

export type CalendarExceptionFormValues = z.infer<typeof calendarExceptionFormSchema>

/** Düzenlemede kayıt listedeki birleşik satırdır (ardışık günler). */
export function createCalendarExceptionFormDefaults(
    group: CalendarExceptionGroup<CalendarException> | null | undefined,
    today: string,
): CalendarExceptionFormValues {
    if (!group) {
        return { kind: "HOLIDAY", startDate: today, endDate: "", scope: FACTORY_SCOPE, note: "" }
    }
    return {
        kind: group.kind,
        startDate: group.startDate,
        endDate: group.endDate === group.startDate ? "" : group.endDate,
        scope: calendarExceptionScopeKey(group),
        note: group.note ?? "",
    }
}

export function buildCalendarExceptionEntryPayload(
    values: CalendarExceptionFormValues,
    replaceIds?: string[],
): CalendarExceptionEntryInput {
    return {
        ...parseScopeValue(values.scope),
        startDate: values.startDate,
        endDate: values.endDate || null,
        kind: values.kind,
        note: values.note || null,
        ...(replaceIds && replaceIds.length > 0 ? { replaceIds } : {}),
    }
}

/** Formun altındaki özet: "3 gün · 26.05.2026 Sal – 28.05.2026 Per"; geçersizse `null`. */
export function describeCalendarEntryPreview(startDate: string, endDate: string): string | null {
    if (!startDate) return null
    const end = endDate || startDate
    if (findCalendarExceptionIssues({ startDate, endDate: end }).length > 0) return null

    const dayCount = enumerateDateKeys(startDate, end).length
    const label = (dateKey: string) => `${formatDateKey(dateKey)} ${weekdayShortLabel(weekdayOfDateKey(dateKey))}`
    return dayCount === 1
        ? `1 gün · ${label(startDate)}`
        : `${dayCount} gün · ${label(startDate)} – ${label(end)}`
}
