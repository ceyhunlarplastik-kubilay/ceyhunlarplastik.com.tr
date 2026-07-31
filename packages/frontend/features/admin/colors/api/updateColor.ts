import { adminApiClient } from "@/lib/http/client"
import type { ColorResponse, ColorSystem } from "./types"
import type { SupportedLocale, TargetLocale } from "@core/i18n/locales"

type TranslationInput = {
    locale: SupportedLocale
    name: string
}

export type UpdateColorParams = {
    id: string
    name?: string
    system?: ColorSystem
    code?: string
    hex?: string
    isActive?: boolean
    translations?: TranslationInput[]
    removeTranslationLocales?: TargetLocale[]
}

export async function updateColor(params: UpdateColorParams) {
    const { id, ...body } = params
    const res = await adminApiClient.put<ColorResponse>(`/colors/${id}`, body)
    return res.data.payload.color
}
