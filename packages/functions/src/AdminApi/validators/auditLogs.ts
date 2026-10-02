import { z } from "zod"

import { AUDIT_LOG_MAX_PAGE_SIZE } from "@/core/helpers/audit/auditLogDto"
import { AUDIT_ENTITY_TYPES } from "@/core/helpers/audit/types"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

// İç `queryStringParameters` objesi KATIdır: ucun kabul ettiği her parametre burada
// beyan edilmeli, yoksa 400 üretir (CLAUDE.md § Bilinen tuzaklar).
export const listAuditLogsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            entityType: z.enum(AUDIT_ENTITY_TYPES),
            // `z.uuid()` DEĞİL: uç modelden bağımsız ve her modelin id'si uuid değil (cuid kullananlar var).
            entityId: z.string().min(1).max(64),
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(AUDIT_LOG_MAX_PAGE_SIZE).optional(),
        }),
    }),
    {
        requiredRootFields: ["queryStringParameters"],
        requiredQueryStringParametersFields: ["entityType", "entityId"],
    },
)

const auditActorSchema = z.object({
    type: z.enum(["USER", "SYSTEM", "ANONYMOUS"]),
    userId: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    groups: z.array(z.string()),
})

// `before` / `after` bilerek serbest: değer tipleri yazma anında `AuditValue` ile
// sınırlanıyor; okuma tarafı beklenmeyen bir değerde 500'e düşmemeli.
const auditChangeSchema = z.object({
    field: z.string(),
    before: z.unknown(),
    after: z.unknown(),
})

export const auditLogSchema = z.object({
    id: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    entityLabel: z.string().nullable(),
    action: z.enum(["CREATE", "UPDATE", "DELETE"]),
    actor: auditActorSchema,
    source: z.string(),
    requestId: z.string().nullable(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    changes: z.array(auditChangeSchema),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string(),
})

const auditEntitySummarySchema = z.object({
    createdBy: auditActorSchema.nullable(),
    createdAt: z.string().nullable(),
    lastChangedBy: auditActorSchema.nullable(),
    lastChangedAt: z.string().nullable(),
})

// Şema handler'ın çıktısıyla ELLE senkron tutulur (TypeScript bağlamaz). Koruma:
// `functions/auditLogs/responseShape.test.ts` handler'ın gerçek çıktısını doğrular.
export const listAuditLogsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(auditLogSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
                summary: auditEntitySummarySchema,
            }),
        }),
    }).loose(),
)
