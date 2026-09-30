"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProductionArea,
    deleteProductionArea,
    listProductionAreas,
    updateProductionArea,
} from "@/features/production/areas/api/productionAreas"
import type { ProductionAreaInput } from "@/features/production/areas/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useProductionAreas() {
    return useQuery({
        queryKey: productionQueryKeys.areas(),
        queryFn: listProductionAreas,
    })
}

/** Alan adı makine listesinde, kullanım sayısı vardiya düzenlerinde görünür. */
function useInvalidateAreaViews() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.all })
}

export function useCreateProductionArea() {
    const invalidate = useInvalidateAreaViews()
    return useMutation({
        mutationFn: (input: ProductionAreaInput) => createProductionArea(input),
        onSuccess: invalidate,
    })
}

export function useUpdateProductionArea() {
    const invalidate = useInvalidateAreaViews()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<ProductionAreaInput> }) => updateProductionArea(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionArea() {
    const invalidate = useInvalidateAreaViews()
    return useMutation({
        mutationFn: (id: string) => deleteProductionArea(id),
        onSuccess: invalidate,
    })
}
