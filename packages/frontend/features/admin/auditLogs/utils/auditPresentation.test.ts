import { describe, expect, it } from "vitest"

import { auditActorLabel, buildAuditChangeView, formatAuditDateTime } from "./auditPresentation"

describe("buildAuditChangeView", () => {
    it("tekil değerde önce / sonra metnini verir", () => {
        expect(buildAuditChangeView({ field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" }))
            .toEqual({ kind: "value", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" })
    })

    it("oluşturma ve silmede olmayan tarafı null bırakır", () => {
        expect(buildAuditChangeView({ field: "code", before: null, after: 10 }))
            .toEqual({ kind: "value", before: null, after: "10" })
        expect(buildAuditChangeView({ field: "name", before: "Kulp", after: null }))
            .toEqual({ kind: "value", before: "Kulp", after: null })
    })

    it("boolean'ı okunur yazar; 0 ve false kaybolmaz", () => {
        expect(buildAuditChangeView({ field: "isActive", before: true, after: false }))
            .toEqual({ kind: "value", before: "Evet", after: "Hayır" })
        expect(buildAuditChangeView({ field: "count", before: 3, after: 0 }))
            .toEqual({ kind: "value", before: "3", after: "0" })
    })

    it("liste alanında eklenen ve çıkarılan öğeleri ayırır", () => {
        expect(buildAuditChangeView({ field: "ids", before: ["a", "b"], after: ["b", "c", "d"] }))
            .toEqual({ kind: "list", added: ["c", "d"], removed: ["a"] })
    })

    it("liste boştan doluyor ya da tamamen boşalıyorsa diğer tarafı boş liste sayar", () => {
        expect(buildAuditChangeView({ field: "ids", before: null, after: ["a"] }))
            .toEqual({ kind: "list", added: ["a"], removed: [] })
        expect(buildAuditChangeView({ field: "ids", before: ["a"], after: null }))
            .toEqual({ kind: "list", added: [], removed: ["a"] })
    })
})

describe("auditActorLabel", () => {
    const actor = { type: "USER" as const, userId: "user-1", name: "Kubilay Uysal", email: "k@example.com", groups: [] }

    it("adı, yoksa e-postayı, o da yoksa genel bir etiketi gösterir", () => {
        expect(auditActorLabel(actor)).toBe("Kubilay Uysal")
        expect(auditActorLabel({ ...actor, name: null })).toBe("k@example.com")
        expect(auditActorLabel({ ...actor, name: " ", email: null })).toBe("Bilinmeyen kullanıcı")
    })

    it("sistem aktörünü ayırt eder", () => {
        expect(auditActorLabel({ ...actor, type: "SYSTEM", name: "translate-category-translations" }))
            .toBe("Sistem (translate-category-translations)")
        expect(auditActorLabel({ ...actor, type: "SYSTEM", name: null })).toBe("Sistem")
    })
})

describe("formatAuditDateTime", () => {
    it("ISO tarihi Türkçe biçimde yazar", () => {
        // Saat, çalışılan makinenin saat dilimine göre değişir; yıl ve ay adı değişmez.
        expect(formatAuditDateTime("2026-09-15T10:00:00.000Z")).toMatch(/15 Eyl 2026/)
    })
})
