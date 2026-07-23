import { adminApiClient } from "@/lib/http/client"
import type { ListMaterialsResponse } from "./types"

export type GetMaterialsParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    certificateOnly?: boolean
}

export async function getMaterials(params?: GetMaterialsParams): Promise<ListMaterialsResponse["payload"]> {
    const res = await adminApiClient.get<ListMaterialsResponse>("/materials", { params })
    return res.data.payload
}
