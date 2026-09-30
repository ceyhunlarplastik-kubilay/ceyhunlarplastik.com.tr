"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createShiftPattern,
    deleteShiftPattern,
    listShiftPatterns,
    replaceShiftPattern,
} from "@/features/production/shiftPatterns/api/shiftPatterns"
import type { ShiftPatternInput } from "@/features/production/shiftPatterns/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useShiftPatterns() {
    return useQuery({
        queryKey: productionQueryKeys.shiftPatterns(),
        queryFn: listShiftPatterns,
    })
}

/** Düzen adı alan ve makine listelerinde de görünür; hepsi birlikte tazelenir. */
function useInvalidateShiftPatternViews() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.all })
}

export function useCreateShiftPattern() {
    const invalidate = useInvalidateShiftPatternViews()
    return useMutation({
        mutationFn: (input: ShiftPatternInput) => createShiftPattern(input),
        onSuccess: invalidate,
    })
}

export function useReplaceShiftPattern() {
    const invalidate = useInvalidateShiftPatternViews()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: ShiftPatternInput }) => replaceShiftPattern(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteShiftPattern() {
    const invalidate = useInvalidateShiftPatternViews()
    return useMutation({
        mutationFn: (id: string) => deleteShiftPattern(id),
        onSuccess: invalidate,
    })
}
