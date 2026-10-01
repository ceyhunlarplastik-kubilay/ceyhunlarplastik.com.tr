import { describe, expect, it } from "vitest"

import { diffAuditSnapshots } from "./auditDiff"

describe("diffAuditSnapshots", () => {
    it("yalnız değişen alanları önce/sonra değeriyle döner", () => {
        const changes = diffAuditSnapshots(
            { code: 10, name: "Bakalit Tutamak", slug: "bakalit-tutamak" },
            { code: 10, name: "Bakalit Tutamaklar", slug: "bakalit-tutamaklar" },
        )

        expect(changes).toEqual([
            { field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" },
            { field: "slug", before: "bakalit-tutamak", after: "bakalit-tutamaklar" },
        ])
    })

    it("hiçbir alan değişmediyse boş liste döner", () => {
        const snapshot = { code: 10, name: "Kulp", allowedAttributeValueIds: ["a", "b"] }

        expect(diffAuditSnapshots(snapshot, { ...snapshot, allowedAttributeValueIds: ["a", "b"] })).toEqual([])
    })

    it("CREATE: önceki hâl yokken dolu alanları before=null ile listeler", () => {
        const changes = diffAuditSnapshots(null, { code: 10, name: "Kulp", allowedAttributeValueIds: [] })

        expect(changes).toEqual([
            { field: "code", before: null, after: 10 },
            { field: "name", before: null, after: "Kulp" },
        ])
    })

    it("DELETE: sonraki hâl yokken alanları after=null ile listeler", () => {
        const changes = diffAuditSnapshots({ code: 10, name: "Kulp" }, null)

        expect(changes).toEqual([
            { field: "code", before: 10, after: null },
            { field: "name", before: "Kulp", after: null },
        ])
    })

    it("eklenen ve kaldırılan alanı (çeviri gibi) yakalar", () => {
        const changes = diffAuditSnapshots(
            { name: "Kulp", "translations.en.name": "Handle" },
            { name: "Kulp", "translations.de.name": "Griff" },
        )

        expect(changes).toEqual([
            { field: "translations.en.name", before: "Handle", after: null },
            { field: "translations.de.name", before: null, after: "Griff" },
        ])
    })

    it("boş ↔ boş (null, boş dizi, olmayan alan) fark sayılmaz", () => {
        expect(diffAuditSnapshots({ ids: [] }, { ids: null })).toEqual([])
        expect(diffAuditSnapshots({ ids: [] }, {})).toEqual([])
        expect(diffAuditSnapshots({}, { ids: [] })).toEqual([])
    })

    it("diziyi eleman eleman karşılaştırır; boştan doluya geçişte gerçek değerleri yazar", () => {
        expect(diffAuditSnapshots({ ids: [] }, { ids: ["a"] })).toEqual([
            { field: "ids", before: [], after: ["a"] },
        ])
        expect(diffAuditSnapshots({ ids: ["a", "b"] }, { ids: ["a", "c"] })).toEqual([
            { field: "ids", before: ["a", "b"], after: ["a", "c"] },
        ])
    })

    it("false ve 0 boş sayılmaz", () => {
        expect(diffAuditSnapshots({ active: true, count: 1 }, { active: false, count: 0 })).toEqual([
            { field: "active", before: true, after: false },
            { field: "count", before: 1, after: 0 },
        ])
        expect(diffAuditSnapshots(null, { active: false, count: 0 })).toEqual([
            { field: "active", before: null, after: false },
            { field: "count", before: null, after: 0 },
        ])
    })
})
