import { adminApiClient } from "@/lib/http/client"
import type { ListMeasurementTypesResponse, MeasurementTypeCode } from "./types"

export type GetMeasurementTypesParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    code?: MeasurementTypeCode
    baseUnit?: string
}

export async function getMeasurementTypes(
    params?: GetMeasurementTypesParams,
): Promise<ListMeasurementTypesResponse["payload"]> {
    const res = await adminApiClient.get<ListMeasurementTypesResponse>("/measurement-types", { params })
    return res.data.payload
}
