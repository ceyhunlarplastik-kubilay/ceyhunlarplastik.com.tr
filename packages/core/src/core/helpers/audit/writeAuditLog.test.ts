import { describe, expect, it, vi } from "vitest"

import type { AuditContext } from "./types"
import { buildAuditLogCreateData, writeAuditLog, writeAuditLogs, type AuditLogEntry } from "./writeAuditLog"

const userContext: AuditContext = {
    actor: {
        type: "USER",
        userId: "user-1",
        cognitoSub: "sub-1",
        email: "kubilay@example.com",
        name: "Kubilay Uysal",
        groups: ["admin"],
    },
    source: "PUT /categories/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
}

const entry: AuditLogEntry = {
    entityType: "Category",
    entityId: "category-1",
    entityLabel: "10 · Bakalit Tutamaklar",
    action: "UPDATE",
    changes: [{ field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" }],
    context: userContext,
}

describe("buildAuditLogCreateData", () => {
    it("kullanıcı aktörünün künyesini satıra kopyalar", () => {
        expect(buildAuditLogCreateData(entry)).toEqual({
            entityType: "Category",
            entityId: "category-1",
            entityLabel: "10 · Bakalit Tutamaklar",
            action: "UPDATE",
            actorType: "USER",
            actorUserId: "user-1",
            actorCognitoSub: "sub-1",
            actorEmail: "kubilay@example.com",
            actorName: "Kubilay Uysal",
            actorGroups: ["admin"],
            source: "PUT /categories/{id}",
            requestId: "req-1",
            ipAddress: "203.0.113.7",
            userAgent: "Mozilla/5.0",
            changes: [{ field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" }],
        })
    })

    it("sistem aktöründe kullanıcı alanlarını yazmaz", () => {
        const data = buildAuditLogCreateData({
            ...entry,
            context: {
                actor: { type: "SYSTEM", name: "translate-category-translations" },
                source: "cli:translate-category-translations",
                requestId: null,
                ipAddress: null,
                userAgent: null,
            },
        })

        expect(data.actorType).toBe("SYSTEM")
        expect(data.actorName).toBe("translate-category-translations")
        expect(data).not.toHaveProperty("actorUserId")
        expect(data).not.toHaveProperty("actorEmail")
    })

    it("metadata verilmişse yazar, verilmemişse alanı hiç göndermez", () => {
        expect(buildAuditLogCreateData(entry)).not.toHaveProperty("metadata")
        expect(buildAuditLogCreateData({ ...entry, metadata: null })).not.toHaveProperty("metadata")
        expect(buildAuditLogCreateData({
            ...entry,
            metadata: { cascade: { productCount: 3, assetKeys: ["categories/x/a.png"] } },
        }).metadata).toEqual({ cascade: { productCount: 3, assetKeys: ["categories/x/a.png"] } })
    })

    it("aşırı uzun etiketi keser", () => {
        const data = buildAuditLogCreateData({ ...entry, entityLabel: "x".repeat(500) })

        expect(data.entityLabel).toHaveLength(200)
    })
})

describe("writeAuditLog", () => {
    it("kaydı verilen istemcinin (transaction) auditLog.create'i ile yazar", async () => {
        const create = vi.fn().mockResolvedValue({ id: "audit-1" })

        await writeAuditLog({ auditLog: { create } }, entry)

        expect(create).toHaveBeenCalledTimes(1)
        expect(create).toHaveBeenCalledWith({ data: buildAuditLogCreateData(entry) })
    })

    it("yazma hatasını yutmaz: transaction geri alınabilsin", async () => {
        const create = vi.fn().mockRejectedValue(new Error("db down"))

        await expect(writeAuditLog({ auditLog: { create } }, entry)).rejects.toThrow("db down")
    })
})

describe("anonim aktör ve toplu yazma", () => {
    it("anonim aktörde kullanıcı alanlarını yazmaz, IP ve tarayıcıyı korur", () => {
        const data = buildAuditLogCreateData({
            ...entry,
            action: "CREATE",
            context: {
                actor: { type: "ANONYMOUS", name: "Web formu" },
                source: "POST /customers",
                requestId: "req-9",
                ipAddress: "198.51.100.5",
                userAgent: "Mozilla/5.0",
            },
        })

        expect(data).toMatchObject({ actorType: "ANONYMOUS", actorName: "Web formu", ipAddress: "198.51.100.5" })
        expect(data).not.toHaveProperty("actorUserId")
    })

    it("writeAuditLogs kayıtları TEK createMany ile yazar", async () => {
        const createMany = vi.fn().mockResolvedValue({ count: 2 })

        await writeAuditLogs({ auditLog: { createMany } }, [entry, { ...entry, entityId: "category-2" }])

        expect(createMany).toHaveBeenCalledTimes(1)
        expect(createMany.mock.calls[0][0].data).toHaveLength(2)
        expect(createMany.mock.calls[0][0].data[1]).toMatchObject({ entityId: "category-2" })
    })

    it("boş listede veritabanına gitmez", async () => {
        const createMany = vi.fn()

        await writeAuditLogs({ auditLog: { createMany } }, [])

        expect(createMany).not.toHaveBeenCalled()
    })
})
