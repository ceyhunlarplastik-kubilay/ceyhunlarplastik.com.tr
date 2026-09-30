"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
    createProductionOrder,
    deleteProductionJob,
    deleteProductionOrder,
    getProductionOrderCandidates,
    planProductionOrder,
    listProductionOrders,
    updateProductionOrder,
} from "@/features/production/orders/api/productionOrders"
import type {
    PlanProductionOrderInput,
    ProductionOrderInput,
    ProductionOrderListQuery,
    ProductionOrderUpdateInput,
} from "@/features/production/orders/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Sunucuda sayfalanan liste; sayfa/filtre değişirken önceki sayfa ekranda kalır. */
export function useProductionOrders(query: ProductionOrderListQuery) {
    return useQuery({
        queryKey: productionQueryKeys.orders(query),
        queryFn: () => listProductionOrders(query),
        placeholderData: (previous) => previous,
    })
}

/** Plan önizlemesi; her açılışta taze hesaplanır (takvim/duruş/kalıp değişmiş olabilir). */
export function useProductionOrderCandidates(orderId: string | null) {
    return useQuery({
        queryKey: productionQueryKeys.orderCandidates(orderId ?? ""),
        queryFn: () => getProductionOrderCandidates(orderId as string),
        enabled: Boolean(orderId),
        staleTime: 0,
    })
}

function useInvalidateOrders() {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() })
}

/** Plan yazma / iş iptali tahtayı da değiştirir. */
function useInvalidateOrdersAndBoard() {
    const qc = useQueryClient()
    return () => Promise.all([
        qc.invalidateQueries({ queryKey: productionQueryKeys.ordersAll() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.boardAll() }),
        qc.invalidateQueries({ queryKey: productionQueryKeys.lotsAll() }),
    ])
}

export function useCreateProductionOrder() {
    const invalidate = useInvalidateOrders()
    return useMutation({
        mutationFn: (input: ProductionOrderInput) => createProductionOrder(input),
        onSuccess: invalidate,
    })
}

export function useUpdateProductionOrder() {
    const invalidate = useInvalidateOrders()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: ProductionOrderUpdateInput }) => updateProductionOrder(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionOrder() {
    const invalidate = useInvalidateOrders()
    return useMutation({
        mutationFn: (id: string) => deleteProductionOrder(id),
        onSuccess: invalidate,
    })
}

export function usePlanProductionOrder() {
    const invalidate = useInvalidateOrdersAndBoard()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: PlanProductionOrderInput }) => planProductionOrder(id, input),
        onSuccess: invalidate,
    })
}

export function useDeleteProductionJob() {
    const invalidate = useInvalidateOrdersAndBoard()
    return useMutation({
        mutationFn: (id: string) => deleteProductionJob(id),
        onSuccess: invalidate,
    })
}
