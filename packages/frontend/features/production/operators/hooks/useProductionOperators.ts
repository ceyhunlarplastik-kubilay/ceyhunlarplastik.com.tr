"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProductionOperator,
    deleteProductionOperator,
    listProductionOperators,
    updateProductionOperator,
} from "@/features/production/operators/api/productionOperators"
import type { ProductionOperatorInput } from "@/features/production/operators/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useProductionOperators() {
    return useQuery({
        queryKey: productionQueryKeys.operators(),
        queryFn: listProductionOperators,
    })
}

function useInvalidateOperators() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.operators() })
}

export function useCreateProductionOperator() {
    const invalidate = useInvalidateOperators()
    return useMutation({
        mutationFn: (input: ProductionOperatorInput) => createProductionOperator(input),
        onSuccess: invalidate,
    })
}

export function useUpdateProductionOperator() {
    const invalidate = useInvalidateOperators()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<ProductionOperatorInput> }) =>
            updateProductionOperator(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionOperator() {
    const invalidate = useInvalidateOperators()
    return useMutation({
        mutationFn: (id: string) => deleteProductionOperator(id),
        onSuccess: invalidate,
    })
}
