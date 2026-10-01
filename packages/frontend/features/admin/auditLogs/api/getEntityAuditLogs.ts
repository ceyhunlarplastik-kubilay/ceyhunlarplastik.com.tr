import { adminApiClient } from "@/lib/http/client"

import type { AuditEntityType, ListAuditLogsResponse } from "./types"

export type GetEntityAuditLogsParams = {
    entityType: AuditEntityType
    entityId: string
    page?: number
    limit?: number
}

/** Bir kaydın değişiklik geçmişi (en yeni en üstte) + oluşturan / son değiştiren özeti. */
export async function getEntityAuditLogs(
    params: GetEntityAuditLogsParams,
): Promise<ListAuditLogsResponse["payload"]> {
    const res = await adminApiClient.get<ListAuditLogsResponse>("/audit-logs", { params })

    return res.data.payload
}
