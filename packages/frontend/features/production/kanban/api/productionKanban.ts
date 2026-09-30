import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ProductionKanban, TransitionJobInput, TransitionJobResult } from "@/features/production/kanban/api/types"

export async function getProductionKanban(): Promise<ProductionKanban> {
    const res = await protectedApiClient.get<ApiEnvelope<ProductionKanban>>("/production/kanban")
    return res.data.payload
}

/** Durum geçişi — kural sunucuda (core durum makinesi); emir durumu da orada türetilir. */
export async function transitionProductionJob(id: string, input: TransitionJobInput): Promise<TransitionJobResult> {
    const res = await protectedApiClient.patch<ApiEnvelope<TransitionJobResult>>(`/production/jobs/${id}/status`, input)
    return res.data.payload
}
