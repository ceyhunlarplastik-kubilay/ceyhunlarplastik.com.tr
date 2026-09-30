"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProductionLotNote,
    deleteProductionLotNote,
    getProductionLot,
    listProductionLots,
    replaceProductionLotOperators,
    reportProductionLot,
    startProductionLot,
} from "@/features/production/lots/api/productionLots"
import type { LotListQuery, LotNoteInput, LotReportInput } from "@/features/production/lots/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Sunucuda sayfalanan liste; süzgeç değişirken önceki sayfa ekranda kalır. */
export function useProductionLots(query: LotListQuery) {
    return useQuery({
        queryKey: productionQueryKeys.lots(query),
        queryFn: () => listProductionLots(query),
        placeholderData: (previous) => previous,
    })
}

export function useProductionLot(lotNumber: string, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: productionQueryKeys.lot(lotNumber),
        queryFn: () => getProductionLot(lotNumber),
        retry: false,
        enabled: options.enabled ?? true,
    })
}

/** Lot ayrıntısı + listedeki ekip / not sayısı birlikte tazelenir. */
function useInvalidateLots() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() })
}

export function useReplaceLotOperators(lotNumber: string) {
    const invalidate = useInvalidateLots()
    return useMutation({
        mutationFn: (operatorIds: string[]) => replaceProductionLotOperators(lotNumber, operatorIds),
        onSuccess: invalidate,
    })
}

export function useCreateLotNote(lotNumber: string) {
    const invalidate = useInvalidateLots()
    return useMutation({
        mutationFn: (input: LotNoteInput) => createProductionLotNote(lotNumber, input),
        onSuccess: invalidate,
    })
}

export function useDeleteLotNote() {
    const invalidate = useInvalidateLots()
    return useMutation({
        mutationFn: (id: string) => deleteProductionLotNote(id),
        onSuccess: invalidate,
    })
}

/** Lot başlatma / rapor işi, emri, tahtayı ve panoyu da değiştirir. */
function useInvalidateExecution() {
    const qc = useQueryClient()
    return () => Promise.all([
        qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.kanban() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.boardAll() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
    ])
}

export function useStartLot() {
    const invalidate = useInvalidateExecution()
    return useMutation({
        mutationFn: ({ lotNumber, input }: { lotNumber: string; input: { startedAt?: string; expectedVersion: number } }) => startProductionLot(lotNumber, input),
        onSettled: invalidate,
    })
}

export function useReportLot() {
    const invalidate = useInvalidateExecution()
    return useMutation({
        mutationFn: ({ lotNumber, input }: { lotNumber: string; input: LotReportInput }) => reportProductionLot(lotNumber, input),
        onSettled: invalidate,
    })
}
