import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { MaterialProfileInput, MaterialWithProfile } from "@/features/production/materials/api/types"

export async function listMaterialProfiles(): Promise<MaterialWithProfile[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ materials: MaterialWithProfile[] }>>("/production/material-profiles")
    return res.data.payload.materials
}

/** Profil yoksa oluşturulur, varsa tamamen değiştirilir. */
export async function upsertMaterialProfile(materialId: string, input: MaterialProfileInput): Promise<MaterialWithProfile> {
    const res = await protectedApiClient.put<ApiEnvelope<{ material: MaterialWithProfile }>>(
        `/production/material-profiles/${materialId}`,
        input,
    )
    return res.data.payload.material
}
