import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type {
    LotDetail,
    LotList,
    LotListQuery,
    LotNote,
    LotNoteInput,
    LotOperators,
    LotReportInput,
    LotReportResult,
} from "@/features/production/lots/api/types"

/** Arama varsa tarih gönderilmez: sunucu tüm lotlarda arar. */
export async function listProductionLots(query: LotListQuery): Promise<LotList> {
    const res = await protectedApiClient.get<ApiEnvelope<LotList>>("/production/lots", {
        params: {
            page: String(query.page),
            limit: String(query.limit),
            ...(query.q ? { q: query.q } : { from: query.from, to: query.to }),
            ...(query.machineId ? { machineId: query.machineId } : {}),
        },
    })
    return res.data.payload
}

export async function getProductionLot(lotNumber: string): Promise<LotDetail> {
    const res = await protectedApiClient.get<ApiEnvelope<{ lot: LotDetail }>>(`/production/lots/${encodeURIComponent(lotNumber)}`)
    return res.data.payload.lot
}

/** Lota özel ekip; boş liste lotu vardiya ekibine döndürür. */
export async function replaceProductionLotOperators(lotNumber: string, operatorIds: string[]): Promise<LotOperators> {
    const res = await protectedApiClient.put<ApiEnvelope<{ operators: LotOperators }>>(
        `/production/lots/${encodeURIComponent(lotNumber)}/operators`,
        { operatorIds },
    )
    return res.data.payload.operators
}

export async function createProductionLotNote(lotNumber: string, input: LotNoteInput): Promise<LotNote> {
    const res = await protectedApiClient.post<ApiEnvelope<{ note: LotNote }>>(`/production/lots/${encodeURIComponent(lotNumber)}/notes`, input)
    return res.data.payload.note
}

export async function deleteProductionLotNote(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/lot-notes/${id}`)
}

/** Lotu başlatır (anlık izleme; iş Üretimde'ye geçer). */
export async function startProductionLot(lotNumber: string, input: { startedAt?: string; expectedVersion: number }): Promise<{ lotNumber: string; jobVersion: number }> {
    const res = await protectedApiClient.post<ApiEnvelope<{ lotNumber: string; jobVersion: number }>>(
        `/production/lots/${encodeURIComponent(lotNumber)}/start`,
        input,
    )
    return res.data.payload
}

/** Vardiya raporu — lotu kapatır; ilk raporda sıradaki lot kendiliğinden başlar. */
export async function reportProductionLot(lotNumber: string, input: LotReportInput): Promise<LotReportResult> {
    const res = await protectedApiClient.put<ApiEnvelope<LotReportResult>>(`/production/lots/${encodeURIComponent(lotNumber)}/report`, input)
    return res.data.payload
}
