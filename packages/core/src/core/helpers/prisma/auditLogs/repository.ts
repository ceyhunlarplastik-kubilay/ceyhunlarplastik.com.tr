import { prisma } from "@/core/db/prisma"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"

import type { AuditLogRecord } from "@/core/helpers/audit/auditLogDto"
import type { AuditEntityType } from "@/core/helpers/audit/types"
import type { IPaginationMeta } from "@/core/helpers/pagination/types"
import type { Prisma } from "@/prisma/generated/prisma/client"

type EntityRef = {
    entityType: AuditEntityType
    entityId: string
}

// `actorCognitoSub` bilinçli olarak seçilmez: okuma yüzeyinin ihtiyacı yok.
const auditLogSelect = {
    id: true,
    entityType: true,
    entityId: true,
    entityLabel: true,
    action: true,
    actorType: true,
    actorUserId: true,
    actorEmail: true,
    actorName: true,
    actorGroups: true,
    source: true,
    requestId: true,
    ipAddress: true,
    userAgent: true,
    changes: true,
    metadata: true,
    createdAt: true,
} satisfies Prisma.AuditLogSelect

// Aynı milisaniyeye düşen kayıtlarda sıra sayfalar arasında oynamasın.
const newestFirst = [{ createdAt: "desc" }, { id: "desc" }] satisfies Prisma.AuditLogOrderByWithRelationInput[]

/**
 * Denetim kayıtlarının OKUMA tarafı. Yazma burada YOK: kayıt, değişikliği yapan
 * transaction içinde `writeAuditLog` ile yazılır; güncelleme / silme yolu hiç yoktur.
 */
export interface IPrismaAuditLogRepository {
    /** Bir kaydın geçmişi, en yeni en üstte. */
    listEntityAuditLogs(query: EntityRef & { page: number; limit: number }): Promise<{
        data: AuditLogRecord[]
        meta: IPaginationMeta
    }>
    /** Kaydın CREATE kaydı (varsa) ve en son kaydı — "oluşturan / son değiştiren" bunlardan türer. */
    getEntityAuditBoundaries(entity: EntityRef): Promise<{
        creation: AuditLogRecord | null
        latest: AuditLogRecord | null
    }>
}

export const auditLogRepository = (): IPrismaAuditLogRepository => {
    const listEntityAuditLogs = async ({
        entityType,
        entityId,
        page,
        limit,
    }: EntityRef & { page: number; limit: number }) => {
        const where: Prisma.AuditLogWhereInput = { entityType, entityId }

        const [rows, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: newestFirst,
                skip: (page - 1) * limit,
                take: limit,
                select: auditLogSelect,
            }),
            prisma.auditLog.count({ where }),
        ])

        return buildPaginationResponse<AuditLogRecord>(rows, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getEntityAuditBoundaries = async ({ entityType, entityId }: EntityRef) => {
        const [creation, latest] = await Promise.all([
            prisma.auditLog.findFirst({
                where: { entityType, entityId, action: "CREATE" },
                orderBy: { createdAt: "asc" },
                select: auditLogSelect,
            }),
            prisma.auditLog.findFirst({
                where: { entityType, entityId },
                orderBy: newestFirst,
                select: auditLogSelect,
            }),
        ])

        return { creation, latest }
    }

    return {
        listEntityAuditLogs,
        getEntityAuditBoundaries,
    }
}
