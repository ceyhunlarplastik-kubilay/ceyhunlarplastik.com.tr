import { adminApiClient } from "@/lib/http/client"
import type { ColorResponse } from "./types"

export async function deleteColor(id: string) {
    const res = await adminApiClient.delete<ColorResponse>(`/colors/${id}`)
    return res.data.payload.color
}
