import { publicApiClient } from "@/lib/http/client"
import type { GeoCitiesResponse } from "@/features/geo/api/types"

export async function getGeoCities(stateId: number) {
    const res = await publicApiClient.get<GeoCitiesResponse>(`/geo/states/${stateId}/cities`)
    return res.data.payload.data
}
