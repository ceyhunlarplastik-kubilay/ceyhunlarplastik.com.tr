import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeResponse } from "./types"

export async function deleteMeasurementType(id: string) {
    const res = await adminApiClient.delete<MeasurementTypeResponse>(`/measurement-types/${id}`)
    return res.data.payload.measurementType
}
