import { adminApiClient } from "@/lib/http/client"
import type { MaterialResponse } from "./types"

type Params = {
    name: string
    code?: string
}

export async function createMaterial(params: Params) {
    const res = await adminApiClient.post<MaterialResponse>("/materials", params)
    return res.data.payload.material
}
