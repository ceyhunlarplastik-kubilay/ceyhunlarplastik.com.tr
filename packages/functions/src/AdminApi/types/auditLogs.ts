import type { AuditEntityType } from "@/core/helpers/audit/types"
import type { IPrismaAuditLogRepository } from "@/core/helpers/prisma/auditLogs/repository"
import type { IAPIGatewayProxyEventWithUser } from "@/core/helpers/utils/api/types"

export interface IListAuditLogsQueryParams {
    entityType?: AuditEntityType
    entityId?: string
    // Validator (ajv `coerceTypes`) sayıya çevirir; doğrudan çağrıda string de gelebilir.
    page?: number | string
    limit?: number | string
}

export type IListAuditLogsEvent =
    IAPIGatewayProxyEventWithUser & {
        queryStringParameters?: IListAuditLogsQueryParams
    }

export interface IAuditLogDependencies {
    auditLogRepository: IPrismaAuditLogRepository
}
