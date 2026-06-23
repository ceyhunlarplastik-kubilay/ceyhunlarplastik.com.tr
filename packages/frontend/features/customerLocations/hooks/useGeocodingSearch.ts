"use client"

import { useMutation } from "@tanstack/react-query"
import { searchGeocoding } from "@/features/customerLocations/api/geocoding"

export function useGeocodingSearch() {
    return useMutation({
        mutationFn: searchGeocoding,
    })
}

