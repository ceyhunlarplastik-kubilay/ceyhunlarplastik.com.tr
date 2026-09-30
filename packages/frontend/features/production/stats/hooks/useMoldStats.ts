"use client"

import { useQuery } from "@tanstack/react-query"

import { getMoldStats } from "@/features/production/stats/api/moldStats"
import type { MoldStatsQuery } from "@/features/production/stats/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Pencere değişirken önceki sonuç ekranda kalır (bölüm-yerel katman). */
export function useMoldStats(query: MoldStatsQuery) {
    return useQuery({
        queryKey: productionQueryKeys.moldStats(query),
        queryFn: () => getMoldStats(query),
        placeholderData: (previous) => previous,
    })
}
