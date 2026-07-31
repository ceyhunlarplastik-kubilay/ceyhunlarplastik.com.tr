import { adminApiClient } from "@/lib/http/client"
import type { MaterialResponse } from "./types"
import type { SupportedLocale, TargetLocale } from "@core/i18n/locales"

type TranslationInput = {
    locale: SupportedLocale
    name: string
}

export type UpdateMaterialParams = {
    id: string
    name?: string
    code?: string
    translations?: TranslationInput[]
    removeTranslationLocales?: TargetLocale[]
    assetKey?: string
    assetType?: "PDF"
    assetRole?: "CERTIFICATE"
    mimeType?: string
}

export async function updateMaterial(params: UpdateMaterialParams) {
    const { id, ...body } = params
    const res = await adminApiClient.put<MaterialResponse>(`/materials/${id}`, body)
    return res.data.payload.material
}
