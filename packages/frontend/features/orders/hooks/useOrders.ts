"use client"

import { useQuery } from "@tanstack/react-query"
import { listOrders } from "@/features/orders/api/listOrders"
import type { ListOrdersParams, OrderListScope } from "@/features/orders/api/types"

export function useOrders(input: {
    scope: OrderListScope
    params?: ListOrdersParams
}) {
    return useQuery({
        queryKey: ["orders", input.scope, input.params],
        queryFn: () => listOrders(input.scope, input.params),
    })
}
