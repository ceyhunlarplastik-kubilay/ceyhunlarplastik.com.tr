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
}

export function useSupplierProducts(params: Params = {}) {
    return useQuery({
        queryKey: ["supplier-products", params],
        queryFn: () => getSupplierProducts(params),
    })
}

