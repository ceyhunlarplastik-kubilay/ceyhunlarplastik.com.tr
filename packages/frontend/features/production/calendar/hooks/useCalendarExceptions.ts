"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    deleteCalendarExceptions,
    listCalendarExceptions,
    saveCalendarExceptionEntry,
} from "@/features/production/calendar/api/calendarExceptions"
import type { CalendarExceptionEntryInput } from "@/features/production/calendar/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Bir yılın kayıtları; yıl değişirken önceki liste ekranda kalır (bölüm-yerel yükleme katmanı). */
export function useCalendarExceptions(year: number) {
    const range = { from: `${year}-01-01`, to: `${year}-12-31` }
    return useQuery({
        queryKey: productionQueryKeys.calendarExceptions(range),
        queryFn: () => listCalendarExceptions(range),
        placeholderData: (previous) => previous,
    })
}

function useInvalidateCalendarExceptions() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.calendarExceptionsAll() })
}

export function useSaveCalendarExceptionEntry() {
    const invalidate = useInvalidateCalendarExceptions()
    return useMutation({
        mutationFn: (input: CalendarExceptionEntryInput) => saveCalendarExceptionEntry(input),
        onSuccess: invalidate,
    })
}

export function useDeleteCalendarExceptions() {
    const invalidate = useInvalidateCalendarExceptions()
    return useMutation({
        mutationFn: (ids: string[]) => deleteCalendarExceptions(ids),
        onSuccess: invalidate,
    })
}
