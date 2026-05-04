"use client"

import { useQuery } from "@tanstack/react-query"
import { getProducts, type GetProductsParams } from "@/features/admin/products/api/getProducts"

export function useProducts(params: GetProductsParams) {
    return useQuery({
        queryKey: ["admin-products", params],
        queryFn: () => getProducts(params),
        placeholderData: (prev) => prev,
        enabled: params.limit !== 0,
    })
}
