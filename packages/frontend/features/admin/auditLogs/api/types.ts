import type { AuditAction, AuditActorType, AuditChange, AuditEntityType, AuditValue } from "@core/helpers/audit/types"

export type { AuditAction, AuditActorType, AuditChange, AuditEntityType, AuditValue }

export type AuditActor = {
    type: AuditActorType
    /** Kullanıcı sonradan silindiyse null; ad / e-posta olay anındaki künyeden gelir. */
    userId: string | null
    name: string | null
    email: string | null
    groups: string[]
}

export type AuditLogEntry = {
    id: string
    entityType: string
    entityId: string
    entityLabel: string | null
    action: AuditAction
    actor: AuditActor
    source: string
    requestId: string | null
    ipAddress: string | null
    userAgent: string | null
    changes: AuditChange[]
    metadata: Record<string, unknown> | null
    createdAt: string
}

export type AuditEntitySummary = {
    /** CREATE kaydı yoksa (denetim devreye girmeden önce oluşmuş kayıt) null. */
    createdBy: AuditActor | null
    createdAt: string | null
    lastChangedBy: AuditActor | null
    lastChangedAt: string | null
}

export type ListAuditLogsResponse = {
    statusCode: number
    payload: {
        data: AuditLogEntry[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        summary: AuditEntitySummary
    }
}
