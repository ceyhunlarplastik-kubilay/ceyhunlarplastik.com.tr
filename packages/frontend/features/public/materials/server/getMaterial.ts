import { publicServerClient } from "@/lib/http/serverClient"
import type { ApiEnvelope } from "@/lib/http/types"
import type { PublicMaterial } from "@/features/public/materials/types"
import { cache } from "react"
import { unstable_cache } from "next/cache"

type GetMaterialResponse = ApiEnvelope<{
    material: PublicMaterial
}>

async function fetchMaterial(materialId: string, locale = "tr"): Promise<PublicMaterial | null> {
    try {
        const res = await publicServerClient().get<GetMaterialResponse>(
            `/materials/${materialId}`,
            { params: { locale } },
        )
        return res.data.payload.material ?? null
    } catch (error: unknown) {
        const details = error as { response?: { status?: number }; code?: string; message?: string }
        if (details.response?.status !== 404) {
            console.error("getMaterial error:", {
                status: details.response?.status,
                code: details.code,
                message: details.message,
            })
        }
        if (details.response?.status === 404) return null
        throw error
    }
}

const getCachedMaterial = unstable_cache(fetchMaterial, ["public-material"], {
    revalidate: 60,
})

export const getMaterial = cache(async (
    materialId: string,
    options: { locale?: string } = {},
): Promise<PublicMaterial | null> => {
    try {
        return await getCachedMaterial(materialId, options.locale ?? "tr")
    } catch {
        return null
    }
})
