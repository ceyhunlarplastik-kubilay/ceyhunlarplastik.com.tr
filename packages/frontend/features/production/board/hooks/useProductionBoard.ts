"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getProductionBoard, pushJobFollowers, rescheduleProductionJob } from "@/features/production/board/api/productionBoard"
import type { RescheduleJobInput } from "@/features/production/board/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Pencere değişirken önceki tahta ekranda kalır (bölüm-yerel yükleme katmanı). */
export function useProductionBoard(range: { from: string; to: string }, refetchIntervalMs: number | false) {
    return useQuery({
        queryKey: productionQueryKeys.board(range),
        queryFn: () => getProductionBoard(range),
        placeholderData: (previous) => previous,
        refetchInterval: refetchIntervalMs,
    })
}

/**
 * Taşıma sonrası tahta (her durumda — 409'da da güncel sürüm gelsin) ve emirler (işin
 * zamanları emir satırında da görünüyor) tazelenir.
 */
export function useRescheduleProductionJob() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: RescheduleJobInput }) => rescheduleProductionJob(id, input),
        onSettled: () => Promise.all([
            qc.invalidateQueries({ queryKey: productionQueryKeys.boardAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
        ]),
    })
}

/** Gecikme önerisi — taşımayla aynı görünümler tazelenir (kaydırılan işlerin lotları da değişir). */
export function usePushJobFollowers() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => pushJobFollowers(id),
        onSettled: () => Promise.all([
            qc.invalidateQueries({ queryKey: productionQueryKeys.boardAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.kanban() }),
        ]),
    })
}
