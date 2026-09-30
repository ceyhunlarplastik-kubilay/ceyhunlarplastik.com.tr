"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { copyShiftRoster, getShiftRoster, replaceShiftCell } from "@/features/production/roster/api/productionRoster"
import type { RosterCellInput, RosterCopyInput } from "@/features/production/roster/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useShiftRoster(date: string) {
    return useQuery({
        queryKey: productionQueryKeys.roster(date),
        queryFn: () => getShiftRoster(date),
        placeholderData: (previous) => previous,
    })
}

/** Ekip değişince lotların (vardiya ekibinden türeyen) ekibi de değişir. */
function useInvalidateRoster() {
    const qc = useQueryClient()
    return () => Promise.all([
        qc.invalidateQueries({ queryKey: productionQueryKeys.rosterAll() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
    ])
}

export function useReplaceShiftCell() {
    const invalidate = useInvalidateRoster()
    return useMutation({ mutationFn: (input: RosterCellInput) => replaceShiftCell(input), onSuccess: invalidate })
}

export function useCopyShiftRoster() {
    const invalidate = useInvalidateRoster()
    return useMutation({ mutationFn: (input: RosterCopyInput) => copyShiftRoster(input), onSuccess: invalidate })
}
