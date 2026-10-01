import createError from "http-errors"

import {
    AUDIT_LOG_MAX_PAGE_SIZE,
    toAuditEntitySummaryDto,
    toAuditLogDto,
} from "@/core/helpers/audit/auditLogDto"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IAuditLogDependencies, IListAuditLogsEvent } from "@/functions/AdminApi/types/auditLogs"

// Sıra sabit (en yeni en üstte); `normalizeListQuery` yalnız sayfa / boyut için kullanılıyor.
const SORT_FIELDS = ["createdAt"] as const

/** Bir kaydın değişiklik geçmişi + "oluşturan / son değiştiren" özeti. */
export const listAuditLogsHandler = ({ auditLogRepository }: IAuditLogDependencies) => {
    return async (event: IListAuditLogsEvent) => {
        const query = event.queryStringParameters ?? {}
        const { entityType, entityId } = query

        if (!entityType || !entityId) {
            throw new createError.BadRequest("entityType and entityId are required")
        }

        const { page, limit } = normalizeListQuery(query, {
            allowedSortFields: SORT_FIELDS,
            defaultSort: "createdAt",
            maxLimit: AUDIT_LOG_MAX_PAGE_SIZE,
        })

        const [result, boundaries] = await Promise.all([
            auditLogRepository.listEntityAuditLogs({ entityType, entityId, page, limit }),
            auditLogRepository.getEntityAuditBoundaries({ entityType, entityId }),
        ])

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                data: result.data.map(toAuditLogDto),
                meta: result.meta,
                summary: toAuditEntitySummaryDto(boundaries),
            },
        })
    }
}
