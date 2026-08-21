"use client"

import { useQuery } from "@tanstack/react-query"
import { getVariantMatrix } from "@/features/admin/productVariantMatrix/api/getVariantMatrix"

export const variantMatrixQueryKey = (productId: string) => ["admin-variant-matrix", productId] as const

export function useVariantMatrix(productId: string) {
    return useQuery({
        queryKey: variantMatrixQueryKey(productId),
        queryFn: () => getVariantMatrix(productId),
        enabled: Boolean(productId),
        // Arka plan yenilemesinde tablo boşalmasın (AGENTS.md refetch deseni).
        placeholderData: (previous) => previous,
    })
}
