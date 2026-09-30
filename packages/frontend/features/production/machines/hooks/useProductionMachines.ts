"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProductionMachine,
    deleteProductionMachine,
    listProductionMachines,
    updateProductionMachine,
} from "@/features/production/machines/api/productionMachines"
import type { ProductionMachineInput } from "@/features/production/machines/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

export function useProductionMachines() {
    return useQuery({
        queryKey: productionQueryKeys.machines(),
        queryFn: listProductionMachines,
    })
}

/** Makine sayısı alan ve vardiya düzeni listelerinde de görünür. */
function useInvalidateMachineViews() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.all })
}

export function useCreateProductionMachine() {
    const invalidate = useInvalidateMachineViews()
    return useMutation({
        mutationFn: (input: ProductionMachineInput) => createProductionMachine(input),
        onSuccess: invalidate,
    })
}

export function useUpdateProductionMachine() {
    const invalidate = useInvalidateMachineViews()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<ProductionMachineInput> }) =>
            updateProductionMachine(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionMachine() {
    const invalidate = useInvalidateMachineViews()
    return useMutation({
        mutationFn: (id: string) => deleteProductionMachine(id),
        onSuccess: invalidate,
    })
}
