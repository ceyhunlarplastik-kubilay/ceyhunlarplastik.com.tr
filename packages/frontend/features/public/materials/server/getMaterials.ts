import { publicServerClient } from "@/lib/http/serverClient"
import type { ApiEnvelope } from "@/lib/http/types"
import type { PublicMaterial } from "@/features/public/materials/types"
import { cache } from "react"
import { unstable_cache } from "next/cache"

type ListMaterialsResponse = ApiEnvelope<{
    data: PublicMaterial[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}>

async function fetchMaterials(limit = 500): Promise<PublicMaterial[]> {
    try {
        const res = await publicServerClient().get<ListMaterialsResponse>("/materials", {
            params: { limit },
        })

        return res.data.payload.data ?? []
    } catch (error: unknown) {
        const details = error as { response?: { status?: number }; code?: string; message?: string }
        console.error("getMaterials error:", {
            status: details.response?.status,
            code: details.code,
            message: details.message,
        })
        throw error
    }
}

const getCachedMaterials = unstable_cache(fetchMaterials, ["public-materials"], {
    revalidate: 60,
})

export const getMaterials = cache(async (options: { limit?: number } = {}): Promise<PublicMaterial[]> => {
    try {
        return await getCachedMaterials(options.limit ?? 500)
    } catch {
        return []
    }
})
