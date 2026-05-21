"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeoStates } from "@/features/geo/api/getGeoStates"

export function useGeoStates(countryId?: number | null) {
    return useQuery({
        queryKey: ["geo-states", countryId],
        queryFn: () => getGeoStates(countryId!),
        enabled: Boolean(countryId),
        staleTime: 1000 * 60 * 60 * 24,
    })
}
