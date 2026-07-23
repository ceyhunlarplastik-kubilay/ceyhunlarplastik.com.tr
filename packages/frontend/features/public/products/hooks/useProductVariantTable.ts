"use client"

import { useQuery } from "@tanstack/react-query"
import { getProductVariantTable } from "@/features/public/products/api/getProductVariantTable"

export function useProductVariantTable(productId: string, locale = "tr") {
    return useQuery({
        queryKey: ["product-variant-table", productId, locale],
        queryFn: () => getProductVariantTable(productId, { locale }),
        enabled: Boolean(productId),
        staleTime: 1000 * 60 * 5,
    })
}
