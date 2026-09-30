import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type {
    ProductionBoard,
    PushJobFollowersResult,
    RescheduleJobInput,
    RescheduleJobResult,
} from "@/features/production/board/api/types"

/** Tahta penceresi: fabrika takviminde gün anahtarları, iki uç dahil. */
export async function getProductionBoard(range: { from: string; to: string }): Promise<ProductionBoard> {
    const res = await protectedApiClient.get<ApiEnvelope<ProductionBoard>>("/production/board", { params: range })
    return res.data.payload
}

/** Taşıma: plan sunucuda yeniden hesaplanır; iş istenen andan sonraki ilk uygun boşluğa yerleşir. */
export async function rescheduleProductionJob(id: string, input: RescheduleJobInput): Promise<RescheduleJobResult> {
    const res = await protectedApiClient.patch<ApiEnvelope<RescheduleJobResult>>(`/production/jobs/${id}/schedule`, input)
    return res.data.payload
}

/** Geciken işin arkasındaki planlı işler tahmini bitişe kaydırılır; tahmin sunucuda hesaplanır. */
export async function pushJobFollowers(id: string): Promise<PushJobFollowersResult> {
    const res = await protectedApiClient.post<ApiEnvelope<PushJobFollowersResult>>(`/production/jobs/${id}/push-followers`, {})
    return res.data.payload
}
