import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeCode, MeasurementTypeResponse } from "./types"
import type { SupportedLocale, TargetLocale } from "@core/i18n/locales"

type TranslationInput = {
    locale: SupportedLocale
    name: string
}

export type UpdateMeasurementTypeParams = {
    id: string
    name?: string
    code?: MeasurementTypeCode
    baseUnit?: string
    displayOrder?: number
    translations?: TranslationInput[]
    removeTranslationLocales?: TargetLocale[]
}

export async function updateMeasurementType(params: UpdateMeasurementTypeParams) {
    const { id, ...body } = params
    const res = await adminApiClient.put<MeasurementTypeResponse>(`/measurement-types/${id}`, body)
    return res.data.payload.measurementType
}
