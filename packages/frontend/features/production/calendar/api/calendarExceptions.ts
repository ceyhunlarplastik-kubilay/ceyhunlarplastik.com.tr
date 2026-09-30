import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { CalendarException, CalendarExceptionEntryInput } from "@/features/production/calendar/api/types"

export async function listCalendarExceptions(range: { from: string; to: string }): Promise<CalendarException[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ exceptions: CalendarException[] }>>(
        "/production/calendar-exceptions",
        { params: range },
    )
    return res.data.payload.exceptions
}

export async function saveCalendarExceptionEntry(input: CalendarExceptionEntryInput): Promise<CalendarException[]> {
    const res = await protectedApiClient.post<ApiEnvelope<{ exceptions: CalendarException[] }>>(
        "/production/calendar-exceptions",
        input,
    )
    return res.data.payload.exceptions
}

export async function deleteCalendarExceptions(ids: string[]): Promise<number> {
    const res = await protectedApiClient.post<ApiEnvelope<{ deletedCount: number }>>(
        "/production/calendar-exceptions/bulk-delete",
        { ids },
    )
    return res.data.payload.deletedCount
}
