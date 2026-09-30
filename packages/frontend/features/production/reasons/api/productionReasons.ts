import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductionReason, ProductionReasonInput } from "@/features/production/reasons/api/types"

export async function listProductionReasons(): Promise<ProductionReason[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ reasons: ProductionReason[] }>>("/production/reasons")
    return res.data.payload.reasons
}

export async function createProductionReason(input: ProductionReasonInput): Promise<ProductionReason> {
    const res = await protectedApiClient.post<ApiEnvelope<{ reason: ProductionReason }>>("/production/reasons", input)
    return res.data.payload.reason
}

/** Tür değiştirilemez. */
export async function updateProductionReason(id: string, input: Partial<Omit<ProductionReasonInput, "kind">>): Promise<ProductionReason> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ reason: ProductionReason }>>(`/production/reasons/${id}`, input)
    return res.data.payload.reason
}

export async function deleteProductionReason(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/reasons/${id}`)
}

export async function createDefaultProductionReasons(): Promise<number> {
    const res = await protectedApiClient.post<ApiEnvelope<{ created: number }>>("/production/reasons/defaults", {})
    return res.data.payload.created
}
