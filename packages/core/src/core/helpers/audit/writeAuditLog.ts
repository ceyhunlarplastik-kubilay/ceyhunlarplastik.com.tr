import type { Prisma } from "@/prisma/generated/prisma/client"

import type {
    AuditAction,
    AuditChange,
    AuditContext,
    AuditEntityType,
    AuditMetadata,
} from "./types"

const ENTITY_LABEL_MAX_LENGTH = 200

export type AuditLogEntry = {
    entityType: AuditEntityType
    entityId: string
    /** Olay anındaki okunur ad — silinen kayıt da listede tanınsın. */
    entityLabel: string | null
    action: AuditAction
    changes: AuditChange[]
    metadata?: AuditMetadata | null
    context: AuditContext
}

export function buildAuditLogCreateData(entry: AuditLogEntry): Prisma.AuditLogUncheckedCreateInput {
    const { actor } = entry.context

    return {
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel?.slice(0, ENTITY_LABEL_MAX_LENGTH) ?? null,
        action: entry.action,
        actorType: actor.type,
        ...(actor.type === "USER"
            ? {
                actorUserId: actor.userId,
                actorCognitoSub: actor.cognitoSub,
                actorEmail: actor.email,
                actorName: actor.name,
                actorGroups: actor.groups,
            }
            : { actorName: actor.name }),
        source: entry.context.source,
        requestId: entry.context.requestId,
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
        changes: entry.changes,
        ...(entry.metadata ? { metadata: entry.metadata } : {}),
    }
}

/** `auditLog.create`'i olan istemci: transaction (`tx`) ya da test sahtesi. */
export type AuditLogWriter = {
    auditLog: {
        create(args: { data: Prisma.AuditLogUncheckedCreateInput }): PromiseLike<unknown>
    }
}

/**
 * Denetim kaydını yazar. HER ZAMAN değişikliği yapan transaction'ın `tx`'i ile çağrılır:
 * kayıt yazılamazsa değişiklik de geri alınır (kayıtsız değişiklik olmaz) ve değişiklik
 * geri alınırsa kayıt da kalmaz. Global `prisma` ile çağırma — transaction'ın DIŞINDA,
 * ayrı bir bağlantıda yazar (CLAUDE.md § Bilinen tuzaklar).
 *
 * `AuditLog` yalnız EKLENİR: tabloya yazan tek yer burasıdır, güncelleme/silme yolu yoktur
 * (`auditCoverage.test.ts` bunu sınar).
 */
export async function writeAuditLog(writer: AuditLogWriter, entry: AuditLogEntry): Promise<void> {
    await writer.auditLog.create({ data: buildAuditLogCreateData(entry) })
}
