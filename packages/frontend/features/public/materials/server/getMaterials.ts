import { publicServerClient } from "@/lib/http/serverClient"
import type { ApiEnvelope } from "@/lib/http/types"
import type { PublicMaterial } from "@/features/public/materials/types"

type ListMaterialsResponse = ApiEnvelope<{
    data: PublicMaterial[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}>

export async function getMaterials(): Promise<PublicMaterial[]> {
    try {
        const res = await publicServerClient().get<ListMaterialsResponse>("/materials", {
            params: { limit: 500 },
        })

        return res.data.payload.data ?? []
    } catch (error: unknown) {
        const details = error as { response?: { status?: number }; code?: string; message?: string }
        console.error("getMaterials error:", {
            status: details.response?.status,
            code: details.code,
            message: details.message,
        })
        return []
    }
}
