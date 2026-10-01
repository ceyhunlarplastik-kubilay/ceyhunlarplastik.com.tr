import { beforeEach, describe, expect, it, vi } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import type { AuditLogRecord } from "@/core/helpers/audit/auditLogDto"
import {
    listAuditLogsResponseValidator,
    listAuditLogsValidator,
} from "@/functions/AdminApi/validators/auditLogs"
import type { IListAuditLogsEvent } from "@/functions/AdminApi/types/auditLogs"

import { listAuditLogsHandler } from "./handlers/listAuditLogsHandler"

/**
 * `GET /audit-logs` sözleşmesi: handler'ın GERÇEK çıktısı response validator'dan,
 * istek de request validator'dan geçirilir. Response şeması handler'la elle senkron
 * tutulduğu için sapma TypeScript'te görünmez, uç çalışma zamanında 500 verir.
 *
 * Bu dosya `validators/` altında DURAMAZ (`validatorCompilation.test.ts` oradaki her
 * modülü eager yüklüyor).
 */
const CATEGORY_ID = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b"

const record = (overrides: Partial<AuditLogRecord> = {}): AuditLogRecord => ({
    id: "11111111-1111-1111-1111-111111111111",
    entityType: "Category",
    entityId: CATEGORY_ID,
    entityLabel: "10 · Bakalit Tutamaklar",
    action: "UPDATE",
    actorType: "USER",
    actorUserId: "33333333-3333-3333-3333-333333333333",
    actorEmail: "kubilay@example.com",
    actorName: "Kubilay Uysal",
    actorGroups: ["admin"],
    source: "PUT /categories/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
    changes: [
        { field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" },
        { field: "allowedAttributeValueIds", before: [], after: ["value-a"] },
    ],
    metadata: null,
    createdAt: new Date("2026-09-30T10:00:00.000Z"),
    ...overrides,
})

const auditLogRepository = {
    listEntityAuditLogs: vi.fn(),
    getEntityAuditBoundaries: vi.fn(),
}

const run = (queryStringParameters: IListAuditLogsEvent["queryStringParameters"]) =>
    listAuditLogsHandler({ auditLogRepository })({ queryStringParameters } as IListAuditLogsEvent)

// Middy'nin istek tarafında kullandığı ajv ayarları (bkz. core/middy.ts).
const validateRequest = () =>
    transpileSchema(listAuditLogsValidator, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as ValidateFunction

describe("GET /audit-logs", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        auditLogRepository.listEntityAuditLogs.mockResolvedValue({
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        })
        auditLogRepository.getEntityAuditBoundaries.mockResolvedValue({ creation: null, latest: null })
    })

    describe("handler çıktısı response şemasından geçer", () => {
        const validateResponse = transpileSchema(listAuditLogsResponseValidator) as unknown as ValidateFunction

        it("dolu geçmiş: güncelleme, oluşturma, silme ve sistem aktörü", async () => {
            const creation = record({
                id: "44444444-4444-4444-4444-444444444444",
                action: "CREATE",
                changes: [{ field: "code", before: null, after: 10 }],
                createdAt: new Date("2026-09-01T08:00:00.000Z"),
            })
            const deletion = record({
                id: "55555555-5555-5555-5555-555555555555",
                action: "DELETE",
                actorUserId: null,
                metadata: { cascade: { productCount: 4, assetKeys: ["categories/x/a.png"] } },
            })
            const system = record({
                id: "66666666-6666-6666-6666-666666666666",
                actorType: "SYSTEM",
                actorUserId: null,
                actorEmail: null,
                actorGroups: [],
                requestId: null,
                ipAddress: null,
                userAgent: null,
                entityLabel: null,
            })
            auditLogRepository.listEntityAuditLogs.mockResolvedValue({
                data: [record(), deletion, system, creation],
                meta: { page: 1, limit: 20, total: 4, totalPages: 1 },
            })
            auditLogRepository.getEntityAuditBoundaries.mockResolvedValue({ creation, latest: record() })

            const response = await run({ entityType: "Category", entityId: CATEGORY_ID })
            const valid = validateResponse(response)

            expect(validateResponse.errors ?? []).toEqual([])
            expect(valid).toBe(true)
        })

        it("boş geçmiş (denetim öncesi oluşmuş kayıt)", async () => {
            const response = await run({ entityType: "Category", entityId: CATEGORY_ID })
            const valid = validateResponse(response)

            expect(validateResponse.errors ?? []).toEqual([])
            expect(valid).toBe(true)
            expect(response.body).toMatchObject({
                payload: {
                    data: [],
                    summary: { createdBy: null, createdAt: null, lastChangedBy: null, lastChangedAt: null },
                },
            })
        })
    })

    describe("handler", () => {
        it("sayfa ve boyutu normalize edip repository'ye geçirir", async () => {
            await run({ entityType: "Category", entityId: CATEGORY_ID, page: "3", limit: "500" })

            expect(auditLogRepository.listEntityAuditLogs).toHaveBeenCalledWith({
                entityType: "Category",
                entityId: CATEGORY_ID,
                page: 3,
                limit: 100,
            })
            expect(auditLogRepository.getEntityAuditBoundaries).toHaveBeenCalledWith({
                entityType: "Category",
                entityId: CATEGORY_ID,
            })
        })

        it("hedef kayıt belirtilmemişse 400 döner, okumaz", async () => {
            await expect(run({ entityType: "Category" })).rejects.toMatchObject({ statusCode: 400 })
            await expect(run(undefined)).rejects.toMatchObject({ statusCode: 400 })

            expect(auditLogRepository.listEntityAuditLogs).not.toHaveBeenCalled()
        })
    })

    describe("istek şeması", () => {
        it("geçerli isteği kabul eder ve sayfa / boyutu sayıya çevirir", () => {
            const validate = validateRequest()
            const event = {
                queryStringParameters: { entityType: "Category", entityId: CATEGORY_ID, page: "2", limit: "50" },
            }

            expect(validate(event)).toBe(true)
            expect(event.queryStringParameters).toMatchObject({ page: 2, limit: 50 })
        })

        it.each([
            ["hedef kayıt yok", { entityType: "Category" }],
            ["model adı yok", { entityId: CATEGORY_ID }],
            ["denetlenmeyen model", { entityType: "User", entityId: CATEGORY_ID }],
            ["boş id", { entityType: "Category", entityId: "" }],
            ["aşırı uzun id", { entityType: "Category", entityId: "x".repeat(65) }],
            ["sınırın üstünde sayfa boyutu", { entityType: "Category", entityId: CATEGORY_ID, limit: "101" }],
            ["beyan edilmemiş parametre", { entityType: "Category", entityId: CATEGORY_ID, actorUserId: "x" }],
        ])("%s → reddeder", (_label, queryStringParameters) => {
            expect(validateRequest()({ queryStringParameters })).toBe(false)
        })

        it("query string hiç yoksa reddeder", () => {
            expect(validateRequest()({})).toBe(false)
        })
    })
})
