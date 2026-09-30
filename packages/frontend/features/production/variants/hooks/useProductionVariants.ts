"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { listProductionVariants, setProductionVariantCycle } from "@/features/production/variants/api/productionVariants"
import type { ProductionVariantListQuery } from "@/features/production/variants/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useProductionVariants(query: ProductionVariantListQuery) {
    return useQuery({
        queryKey: productionQueryKeys.variants(query),
        queryFn: () => listProductionVariants(query),
        placeholderData: (previous) => previous,
    })
}

export function useSetProductionVariantCycle() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ variantId, cycleTimeSec }: { variantId: string; cycleTimeSec: number | null }) =>
            setProductionVariantCycle(variantId, cycleTimeSec),
        // Varyant çevrimi emirlerin plan önizlemesini (Öner) de değiştirir.
        onSuccess: () => Promise.all([
            qc.invalidateQueries({ queryKey: productionQueryKeys.variantsAll() }),
            qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
        ]),
    })
}
