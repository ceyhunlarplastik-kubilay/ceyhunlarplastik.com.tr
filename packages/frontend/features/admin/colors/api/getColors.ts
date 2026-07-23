import { adminApiClient } from "@/lib/http/client"
import type { ColorSystem, ListColorsResponse } from "./types"

export type GetColorsParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    system?: ColorSystem
}

export async function getColors(params?: GetColorsParams): Promise<ListColorsResponse["payload"]> {
    const res = await adminApiClient.get<ListColorsResponse>("/colors", { params })
    return res.data.payload
}
