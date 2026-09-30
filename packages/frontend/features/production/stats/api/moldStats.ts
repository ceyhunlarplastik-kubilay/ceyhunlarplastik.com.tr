import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { MoldStats, MoldStatsQuery } from "@/features/production/stats/api/types"

export async function getMoldStats(query: MoldStatsQuery): Promise<MoldStats> {
    const res = await protectedApiClient.get<ApiEnvelope<MoldStats>>("/production/stats/molds", { params: { from: query.from, to: query.to } })
    return res.data.payload
}
