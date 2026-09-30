"use client"

import { useQuery } from "@tanstack/react-query"

import { getMachineStats } from "@/features/production/stats/api/machineStats"
import type { MachineStatsQuery } from "@/features/production/stats/api/types"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Süzgeç değişirken önceki sonuç ekranda kalır (bölüm-yerel katman). */
export function useMachineStats(query: MachineStatsQuery) {
    return useQuery({
        queryKey: productionQueryKeys.machineStats(query),
        queryFn: () => getMachineStats(query),
        placeholderData: (previous) => previous,
    })
}
