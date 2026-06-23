"use client"

import { useMutation } from "@tanstack/react-query"
import { reverseGeocoding } from "@/features/customerLocations/api/geocoding"

export function useReverseGeocoding() {
    return useMutation({
        mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
            reverseGeocoding(latitude, longitude),
    })
}

