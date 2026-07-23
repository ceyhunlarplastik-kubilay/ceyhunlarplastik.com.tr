import { adminApiClient } from "@/lib/http/client"
import type { MaterialResponse } from "./types"

type TranslationInput = {
    locale: "tr" | "en"
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
