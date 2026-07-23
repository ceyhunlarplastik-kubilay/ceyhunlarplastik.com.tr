import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeCode, MeasurementTypeResponse } from "./types"

type TranslationInput = {
    locale: "tr" | "en"
    name: string
}

export type UpdateMeasurementTypeParams = {
    id: string
    name?: string
    code?: MeasurementTypeCode
    baseUnit?: string
    displayOrder?: number
    translations?: TranslationInput[]
}

export async function updateMeasurementType(params: UpdateMeasurementTypeParams) {
    const { id, ...body } = params
    const res = await adminApiClient.put<MeasurementTypeResponse>(`/measurement-types/${id}`, body)
    return res.data.payload.measurementType
}
