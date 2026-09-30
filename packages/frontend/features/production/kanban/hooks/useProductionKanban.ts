"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getProductionKanban, transitionProductionJob } from "@/features/production/kanban/api/productionKanban"
import type { TransitionJobInput } from "@/features/production/kanban/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useProductionKanban(refetchIntervalMs: number | false) {
    return useQuery({
        queryKey: productionQueryKeys.kanban(),
        queryFn: getProductionKanban,
        placeholderData: (previous) => previous,
        refetchInterval: refetchIntervalMs,
    })
}

/** Geçiş işi, emri ve tahtayı değiştirir; 409'da da güncel sürüm gelsin diye her durumda tazelenir. */
export function useTransitionProductionJob() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: TransitionJobInput }) => transitionProductionJob(id, input),
        onSettled: () => Promise.all([
            qc.invalidateQueries({ queryKey: productionQueryKeys.kanban() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.boardAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
        ]),
    })
}
