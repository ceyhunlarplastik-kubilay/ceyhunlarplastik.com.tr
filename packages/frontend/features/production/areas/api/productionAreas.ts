import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductionArea, ProductionAreaInput } from "@/features/production/areas/api/types"

export async function listProductionAreas(): Promise<ProductionArea[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ areas: ProductionArea[] }>>("/production/areas")
    return res.data.payload.areas
}

export async function createProductionArea(input: ProductionAreaInput): Promise<ProductionArea> {
    const res = await protectedApiClient.post<ApiEnvelope<{ area: ProductionArea }>>("/production/areas", input)
    return res.data.payload.area
}

export async function updateProductionArea(id: string, input: Partial<ProductionAreaInput>): Promise<ProductionArea> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ area: ProductionArea }>>(`/production/areas/${id}`, input)
    return res.data.payload.area
}

export async function deleteProductionArea(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/areas/${id}`)
}
