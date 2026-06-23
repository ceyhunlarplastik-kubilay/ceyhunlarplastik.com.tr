"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductVariantTable } from "@/features/public/products/api/getProductVariantTable"

export function useProductVariantTable(productId: string) {
    return useQuery({
        queryKey: ["product-variant-table", productId],
        queryFn: () => getProductVariantTable(productId),
        enabled: Boolean(productId),
        staleTime: 1000 * 60 * 5,
    })
}
