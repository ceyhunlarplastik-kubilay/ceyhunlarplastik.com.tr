"use client"

import { useQuery } from "@tanstack/react-query"

import { getProductHistory } from "@/features/production/stats/api/productStats"
import type { ProductHistoryQuery } from "@/features/production/stats/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Ürün seçilmeden sorgu yok. Süzgeç değişirken önceki sonuç ekranda kalır (bölüm-yerel katman). */
export function useProductHistory(query: ProductHistoryQuery | null) {
    return useQuery({
        queryKey: query ? productionQueryKeys.productHistory(query) : [...productionQueryKeys.statsAll(), "products", "none"],
        queryFn: () => getProductHistory(query as ProductHistoryQuery),
        enabled: Boolean(query),
        placeholderData: (previous) => previous,
    })
}
