import { adminApiClient } from "@/lib/http/client"
import type { MaterialResponse } from "./types"
import type { SupportedLocale } from "@core/i18n/locales"

type TranslationInput = {
    locale: SupportedLocale
    name: string
}

type Params = {
    name: string
    code?: string
    translations?: TranslationInput[]
}

export async function createMaterial(params: Params) {
    const res = await adminApiClient.post<MaterialResponse>("/materials", params)
    return res.data.payload.material
}
