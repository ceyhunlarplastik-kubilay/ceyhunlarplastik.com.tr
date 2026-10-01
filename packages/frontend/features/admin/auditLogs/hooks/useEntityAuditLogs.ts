"use client"

import { useQuery } from "@tanstack/react-query"

import { auditLogKeys } from "../api/auditLogKeys"
import { getEntityAuditLogs } from "../api/getEntityAuditLogs"
import type { AuditEntityType } from "../api/types"

type Options = {
    entityType: AuditEntityType
    entityId: string
    page: number
    limit: number
}

export function useEntityAuditLogs({ entityType, entityId, page, limit }: Options) {
    return useQuery({
        queryKey: auditLogKeys.entityPage(entityType, entityId, page, limit),
        queryFn: () => getEntityAuditLogs({ entityType, entityId, page, limit }),
        placeholderData: (previous) => previous,
        // Geçmiş, kayıt her kaydedildiğinde değişir: panel açıldığında bayat önbellek gösterme.
        refetchOnMount: "always",
    })
}
