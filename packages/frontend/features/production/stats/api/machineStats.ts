import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { MachineStats, MachineStatsQuery } from "@/features/production/stats/api/types"

/** Boş süzgeç gönderilmez (uç yalnız beyan ettiği alanları kabul eder). */
export async function getMachineStats(query: MachineStatsQuery): Promise<MachineStats> {
    const params: Record<string, string> = { from: query.from, to: query.to }
    if (query.areaId) params.areaId = query.areaId
    const res = await protectedApiClient.get<ApiEnvelope<MachineStats>>("/production/stats/machines", { params })
    return res.data.payload
}
