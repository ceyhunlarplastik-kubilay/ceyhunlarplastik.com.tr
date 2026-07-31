import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeCode, MeasurementTypeResponse } from "./types"
import type { SupportedLocale } from "@core/i18n/locales"

type TranslationInput = {
    locale: SupportedLocale
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
