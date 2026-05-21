"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeoCities } from "@/features/geo/api/getGeoCities"

export function useGeoCities(stateId?: number | null) {
    return useQuery({
        queryKey: ["geo-cities", stateId],
        queryFn: () => getGeoCities(stateId!),
        enabled: Boolean(stateId),
        staleTime: 1000 * 60 * 60 * 24,
    })
}
