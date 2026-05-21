import { publicApiClient } from "@/lib/http/client"
import type { GeoStatesResponse } from "@/features/geo/api/types"

export async function getGeoStates(countryId: number) {
    const res = await publicApiClient.get<GeoStatesResponse>(`/geo/countries/${countryId}/states`)
    return res.data.payload.data
}
