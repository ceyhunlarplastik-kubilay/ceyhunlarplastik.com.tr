import type { AuditEntityType } from "./types"

export const auditLogKeys = {
    all: ["admin-audit-logs"] as const,
    entity: (entityType: AuditEntityType, entityId: string) =>
        [...auditLogKeys.all, entityType, entityId] as const,
    entityPage: (entityType: AuditEntityType, entityId: string, page: number, limit: number) =>
        [...auditLogKeys.entity(entityType, entityId), { page, limit }] as const,
}
