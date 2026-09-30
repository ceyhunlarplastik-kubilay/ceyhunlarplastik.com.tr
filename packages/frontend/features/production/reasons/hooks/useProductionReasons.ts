"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createDefaultProductionReasons,
    createProductionReason,
    deleteProductionReason,
    listProductionReasons,
    updateProductionReason,
} from "@/features/production/reasons/api/productionReasons"
import type { ProductionReasonInput } from "@/features/production/reasons/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Sözlük küçük ve seyrek değişir: vardiya raporu da aynı sorguyu kullanır. */
export function useProductionReasons() {
    return useQuery({ queryKey: productionQueryKeys.reasons(), queryFn: listProductionReasons, staleTime: 5 * 60_000 })
}

function useInvalidateReasons() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.reasons() })
}

export function useCreateProductionReason() {
    const invalidate = useInvalidateReasons()
    return useMutation({ mutationFn: (input: ProductionReasonInput) => createProductionReason(input), onSuccess: invalidate })
}

export function useUpdateProductionReason() {
    const invalidate = useInvalidateReasons()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<Omit<ProductionReasonInput, "kind">> }) => updateProductionReason(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionReason() {
    const invalidate = useInvalidateReasons()
    return useMutation({ mutationFn: (id: string) => deleteProductionReason(id), onSuccess: invalidate })
}

export function useCreateDefaultProductionReasons() {
    const invalidate = useInvalidateReasons()
    return useMutation({ mutationFn: createDefaultProductionReasons, onSuccess: invalidate })
}
