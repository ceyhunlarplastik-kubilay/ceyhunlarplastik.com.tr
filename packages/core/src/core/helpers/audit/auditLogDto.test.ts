import { describe, expect, it } from "vitest"

import {
    parseAuditChanges,
    toAuditEntitySummaryDto,
    toAuditLogDto,
    type AuditLogRecord,
} from "./auditLogDto"

const record = (overrides: Partial<AuditLogRecord> = {}): AuditLogRecord => ({
    id: "11111111-1111-1111-1111-111111111111",
    entityType: "Category",
    entityId: "22222222-2222-2222-2222-222222222222",
    entityLabel: "10 · Bakalit Tutamaklar",
    action: "UPDATE",
    actorType: "USER",
    actorUserId: "user-1",
    actorEmail: "kubilay@example.com",
    actorName: "Kubilay Uysal",
    actorGroups: ["admin"],
    source: "PUT /categories/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
    changes: [{ field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" }],
    metadata: null,
    createdAt: new Date("2026-09-30T10:00:00.000Z"),
    ...overrides,
})

describe("parseAuditChanges", () => {
    it("geçerli değişiklik listesini olduğu gibi döner", () => {
        expect(parseAuditChanges([
            { field: "name", before: "A", after: "B" },
            { field: "allowedAttributeValueIds", before: [], after: ["value-a"] },
            { field: "code", before: null, after: 10 },
        ])).toEqual([
            { field: "name", before: "A", after: "B" },
            { field: "allowedAttributeValueIds", before: [], after: ["value-a"] },
            { field: "code", before: null, after: 10 },
        ])
    })

    it("dizi olmayan ya da bozuk öğeli JSON'da fırlatmaz; bozuk öğeyi atlar", () => {
        expect(parseAuditChanges(null)).toEqual([])
        expect(parseAuditChanges({ field: "name" })).toEqual([])
        expect(parseAuditChanges(["x", null, { before: 1 }, { field: "name", after: "B" }])).toEqual([
            { field: "name", before: null, after: "B" },
        ])
    })

    it("beklenmeyen değer şeklini kaybetmez, JSON metnine çevirir", () => {
        expect(parseAuditChanges([{ field: "config", before: { a: 1 }, after: [1, 2] }])).toEqual([
            { field: "config", before: '{"a":1}', after: "[1,2]" },
        ])
    })
})

describe("toAuditLogDto", () => {
    it("satırı yanıt şekline çevirir", () => {
        expect(toAuditLogDto(record())).toEqual({
            id: "11111111-1111-1111-1111-111111111111",
            entityType: "Category",
            entityId: "22222222-2222-2222-2222-222222222222",
            entityLabel: "10 · Bakalit Tutamaklar",
            action: "UPDATE",
            actor: {
                type: "USER",
                userId: "user-1",
                name: "Kubilay Uysal",
                email: "kubilay@example.com",
                groups: ["admin"],
            },
            source: "PUT /categories/{id}",
            requestId: "req-1",
            ipAddress: "203.0.113.7",
            userAgent: "Mozilla/5.0",
            changes: [{ field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" }],
            metadata: null,
            createdAt: new Date("2026-09-30T10:00:00.000Z"),
        })
    })

    it("izin listesidir: satırdaki fazladan alanlar (cognito sub gibi) yanıta girmez", () => {
        const dto = toAuditLogDto({ ...record(), actorCognitoSub: "sub-1" } as AuditLogRecord)

        expect(JSON.stringify(dto)).not.toContain("sub-1")
    })

    it("silinmiş kullanıcının kaydı künyeyle okunur kalır", () => {
        expect(toAuditLogDto(record({ actorUserId: null })).actor).toEqual({
            type: "USER",
            userId: null,
            name: "Kubilay Uysal",
            email: "kubilay@example.com",
            groups: ["admin"],
        })
    })

    it("metadata nesnesini taşır; nesne değilse null yazar", () => {
        expect(toAuditLogDto(record({ metadata: { cascade: { productCount: 4 } } })).metadata)
            .toEqual({ cascade: { productCount: 4 } })
        expect(toAuditLogDto(record({ metadata: ["x"] })).metadata).toBeNull()
    })
})

describe("toAuditEntitySummaryDto", () => {
    it("oluşturanı CREATE kaydından, son değiştireni en yeni kayıttan alır", () => {
        const creation = record({
            action: "CREATE",
            actorName: "Veri Girişi",
            createdAt: new Date("2026-09-01T08:00:00.000Z"),
        })
        const latest = record({ createdAt: new Date("2026-09-30T10:00:00.000Z") })

        const summary = toAuditEntitySummaryDto({ creation, latest })

        expect(summary.createdBy?.name).toBe("Veri Girişi")
        expect(summary.createdAt).toEqual(new Date("2026-09-01T08:00:00.000Z"))
        expect(summary.lastChangedBy?.name).toBe("Kubilay Uysal")
        expect(summary.lastChangedAt).toEqual(new Date("2026-09-30T10:00:00.000Z"))
    })

    it("denetim öncesi oluşmuş ya da hiç kaydı olmayan kayıtta null döner", () => {
        expect(toAuditEntitySummaryDto({ creation: null, latest: null })).toEqual({
            createdBy: null,
            createdAt: null,
            lastChangedBy: null,
            lastChangedAt: null,
        })
    })
})
