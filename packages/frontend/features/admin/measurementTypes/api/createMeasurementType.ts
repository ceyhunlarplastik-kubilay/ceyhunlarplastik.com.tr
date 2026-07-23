import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeCode, MeasurementTypeResponse } from "./types"

type TranslationInput = {
    locale: "tr" | "en"
    name: string
}

type Params = {
    name: string
    code: MeasurementTypeCode
    baseUnit: string
    displayOrder?: number
    translations?: TranslationInput[]
}

export async function createMeasurementType(params: Params) {
    const res = await adminApiClient.post<MeasurementTypeResponse>("/measurement-types", params)
    return res.data.payload.measurementType
}
