"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierProducts } from "@/features/supplier/variantPrices/api/getSupplierProducts"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    categoryId?: string
    supplierId?: string
    endpointPrefix?: "supplier" | "purchasing" | "sales"
    autoRefreshIntervalMs?: number | false
}

export function useSupplierProducts(params: Params = {}) {
    const { autoRefreshIntervalMs = false, ...queryParams } = params

    return useQuery({
        queryKey: ["supplier-products", queryParams],
        queryFn: () => getSupplierProducts(queryParams),
        refetchInterval: autoRefreshIntervalMs,
    })
}
