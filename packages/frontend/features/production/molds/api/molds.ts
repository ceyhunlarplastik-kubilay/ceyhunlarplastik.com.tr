import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { Mold, MoldInput } from "@/features/production/molds/api/types"

export async function listMolds(): Promise<Mold[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ molds: Mold[] }>>("/production/molds")
    return res.data.payload.molds
}

export async function createMold(input: MoldInput): Promise<Mold> {
    const res = await protectedApiClient.post<ApiEnvelope<{ mold: Mold }>>("/production/molds", input)
    return res.data.payload.mold
}

/** Göz grupları ve makine kartları gönderildiği için ikisi de tam değişimdir. */
export async function updateMold(id: string, input: MoldInput): Promise<Mold> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ mold: Mold }>>(`/production/molds/${id}`, input)
    return res.data.payload.mold
}

export async function deleteMold(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/molds/${id}`)
}

/** "Bakım yapıldı": son bakım sayacı = güncel sayaç; an verilmezse şimdi. */
export async function recordMoldMaintenance(id: string, performedAt?: string): Promise<Mold> {
    const res = await protectedApiClient.post<ApiEnvelope<{ mold: Mold }>>(`/production/molds/${id}/maintenance`, performedAt ? { performedAt } : {})
    return res.data.payload.mold
}

/** Gerçekleşen çevrim önerisini makine kartına yazar (kart yoksa oluşur). */
export async function setMoldMachineCycle(input: { moldId: string; machineId: string; cycleTimeSec: number }): Promise<{ created: boolean }> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ created: boolean }>>(
        `/production/molds/${input.moldId}/machine-profiles/${input.machineId}`,
        { cycleTimeSec: input.cycleTimeSec },
    )
    return { created: res.data.payload.created }
}
