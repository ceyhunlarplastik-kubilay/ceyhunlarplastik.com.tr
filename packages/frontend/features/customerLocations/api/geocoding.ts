import type { GeocodeResult, ReverseGeocodeResult } from "@/features/customerLocations/types"

type GeocodingResponse<T> = {
    data: T
    error?: string
}

async function readResponse<T>(response: Response): Promise<T> {
    const json = await response.json() as GeocodingResponse<T>
    if (!response.ok) {
        throw new Error(json.error || "Geocoding request failed")
    }
    return json.data
}

export async function searchGeocoding(query: string) {
    const response = await fetch(`/geocoding/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        credentials: "same-origin",
    })

    return readResponse<GeocodeResult[]>(response)
}

export async function reverseGeocoding(latitude: number, longitude: number) {
    const response = await fetch(`/geocoding/reverse?lat=${latitude}&lng=${longitude}`, {
        method: "GET",
        credentials: "same-origin",
    })

    return readResponse<ReverseGeocodeResult | null>(response)
}

