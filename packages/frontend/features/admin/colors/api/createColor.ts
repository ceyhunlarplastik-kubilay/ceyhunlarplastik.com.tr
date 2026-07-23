import { adminApiClient } from "@/lib/http/client"
import type { ColorResponse, ColorSystem } from "./types"

type TranslationInput = {
    locale: "tr" | "en"
    name: string
}

type Params = {
    name: string
    system: ColorSystem
    code: string
    hex: string
    translations?: TranslationInput[]
}

export async function createColor(params: Params) {
    const res = await adminApiClient.post<ColorResponse>("/colors", params)
    return res.data.payload.color
}
