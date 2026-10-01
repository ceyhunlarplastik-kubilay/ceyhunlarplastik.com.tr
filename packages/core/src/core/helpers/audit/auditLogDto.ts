import type { AuditAction, AuditChange, AuditMetadata, AuditValue } from "./types"

/** Okuma ucunun tek sayfada döndüreceği en fazla kayıt (validator ve handler aynı değeri okur). */
export const AUDIT_LOG_MAX_PAGE_SIZE = 100

/** `toAuditLogDto`'nun okuduğu satır — `auditLogRepository`'nin select'iyle aynı alanlar. */
export type AuditLogRecord = {
    id: string
    entityType: string
    entityId: string
    entityLabel: string | null
    action: AuditAction
    actorType: "USER" | "SYSTEM"
    actorUserId: string | null
    actorEmail: string | null
    actorName: string | null
    actorGroups: string[]
    source: string
    requestId: string | null
    ipAddress: string | null
    userAgent: string | null
    changes: unknown
    metadata: unknown
    createdAt: Date
}

export type AuditActorDto = {
    type: "USER" | "SYSTEM"
    /** Kullanıcı sonradan silindiyse null; ad / e-posta olay anındaki künyeden gelir. */
    userId: string | null
    name: string | null
    email: string | null
    groups: string[]
}

export type AuditLogDto = {
    id: string
    entityType: string
    entityId: string
    entityLabel: string | null
    action: AuditAction
    actor: AuditActorDto
    source: string
    requestId: string | null
    ipAddress: string | null
    userAgent: string | null
    changes: AuditChange[]
    metadata: AuditMetadata | null
    createdAt: Date
}

/** Kaydı kimin oluşturduğu ve son kimin değiştirdiği — model tablosunda kolon tutmadan, geçmişten. */
export type AuditEntitySummaryDto = {
    /** CREATE kaydı yoksa (denetim devreye girmeden önce oluşmuş kayıt) null. */
    createdBy: AuditActorDto | null
    createdAt: Date | null
    lastChangedBy: AuditActorDto | null
    lastChangedAt: Date | null
}

const isAuditValue = (value: unknown): value is AuditValue =>
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || (Array.isArray(value) && value.every((item) => typeof item === "string"))

// Beklenmeyen bir şekil (elle düzeltilmiş satır, ileride iç içe değer yazan bir model)
// geçmişi 500'e düşürmesin: değer kaybolmaz, JSON metni olarak gösterilir.
const toAuditValue = (value: unknown): AuditValue => {
    if (value === undefined) return null
    return isAuditValue(value) ? value : JSON.stringify(value)
}

/** `changes` JSON kolonunu güvenle okur; bozuk öğeleri atlar, asla fırlatmaz. */
export function parseAuditChanges(value: unknown): AuditChange[] {
    if (!Array.isArray(value)) return []

    return value.flatMap((item): AuditChange[] => {
        if (!item || typeof item !== "object") return []

        const { field, before, after } = item as Record<string, unknown>
        if (typeof field !== "string") return []

        return [{ field, before: toAuditValue(before), after: toAuditValue(after) }]
    })
}

const toAuditMetadata = (value: unknown): AuditMetadata | null =>
    value && typeof value === "object" && !Array.isArray(value)
        ? (value as AuditMetadata)
        : null

export function toAuditActorDto(record: AuditLogRecord): AuditActorDto {
    return {
        type: record.actorType,
        userId: record.actorUserId,
        name: record.actorName,
        email: record.actorEmail,
        groups: record.actorGroups,
    }
}

/**
 * Denetim satırını API yanıtına çevirir. İZİN LİSTESİDİR: `actorCognitoSub` gibi
 * arayüzün ihtiyaç duymadığı alanlar yanıta girmez.
 */
export function toAuditLogDto(record: AuditLogRecord): AuditLogDto {
    return {
        id: record.id,
        entityType: record.entityType,
        entityId: record.entityId,
        entityLabel: record.entityLabel,
        action: record.action,
        actor: toAuditActorDto(record),
        source: record.source,
        requestId: record.requestId,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
        changes: parseAuditChanges(record.changes),
        metadata: toAuditMetadata(record.metadata),
        createdAt: record.createdAt,
    }
}

export function toAuditEntitySummaryDto(boundaries: {
    creation: AuditLogRecord | null
    latest: AuditLogRecord | null
}): AuditEntitySummaryDto {
    const { creation, latest } = boundaries

    return {
        createdBy: creation ? toAuditActorDto(creation) : null,
        createdAt: creation?.createdAt ?? null,
        lastChangedBy: latest ? toAuditActorDto(latest) : null,
        lastChangedAt: latest?.createdAt ?? null,
    }
}
