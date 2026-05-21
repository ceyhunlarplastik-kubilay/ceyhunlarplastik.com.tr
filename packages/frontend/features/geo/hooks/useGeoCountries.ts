"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeoCountries } from "@/features/geo/api/getGeoCountries"

export function useGeoCountries() {
    return useQuery({
        queryKey: ["geo-countries"],
        queryFn: getGeoCountries,
        staleTime: 1000 * 60 * 60 * 24,
    })
}
