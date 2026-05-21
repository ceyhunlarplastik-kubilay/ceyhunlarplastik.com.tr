import { publicApiClient } from "@/lib/http/client"
import type { GeoCountriesResponse } from "@/features/geo/api/types"

export async function getGeoCountries() {
    const res = await publicApiClient.get<GeoCountriesResponse>("/geo/countries")
    return res.data.payload.data
}
