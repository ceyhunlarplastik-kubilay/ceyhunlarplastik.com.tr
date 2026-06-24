import { publicServerClient } from "@/lib/http/serverClient"
import type { ApiEnvelope } from "@/lib/http/types"
import type { PublicMaterial } from "@/features/public/materials/types"

type GetMaterialResponse = ApiEnvelope<{
    material: PublicMaterial
}>

export async function getMaterial(materialId: string): Promise<PublicMaterial | null> {
    try {
        const res = await publicServerClient().get<GetMaterialResponse>(`/materials/${materialId}`)
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
        return null
    }
}
