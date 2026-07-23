import { adminApiClient } from "@/lib/http/client"
import type { ColorResponse, ColorSystem } from "./types"

type TranslationInput = {
    locale: "tr" | "en"
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
}

export async function updateColor(params: UpdateColorParams) {
    const { id, ...body } = params
    const res = await adminApiClient.put<ColorResponse>(`/colors/${id}`, body)
    return res.data.payload.color
}
