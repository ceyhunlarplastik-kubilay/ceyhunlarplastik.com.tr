import { describe, expect, it } from "vitest"

import {
    buildCustomerProfileProductWhereClauses,
    resolveCustomerProfileHierarchy,
} from "./customerProfileMatching"

/**
 * Bu iki fonksiyon müşteri portalındaki "İlgili Ürünler" ile veri girişi
 * panelindeki eşleşme önizlemesinin ORTAK kaynağı. Kural burada kilitlenir ki
 * iki yüzey birbirinden ayrışmasın.
 */

function makeAssignment(code: string, attributeValueId: string) {
    return { attributeValueId, attributeValue: { attribute: { code } } }
}

describe("resolveCustomerProfileHierarchy", () => {
    it("kaydın kolonlarını atama satırlarına tercih eder", () => {
        const hierarchy = resolveCustomerProfileHierarchy({
            sectorValueId: "sector-column",
            productionGroupValueId: "group-column",
            usageAreaValues: [],
            attributeValueAssignments: [
                makeAssignment("sector", "sector-assignment"),
                makeAssignment("production_group", "group-assignment"),
            ],
        })

        expect(hierarchy.sectorValueId).toBe("sector-column")
        expect(hierarchy.productionGroupValueId).toBe("group-column")
    })

    it("kolon boşsa atama satırına düşer", () => {
        const hierarchy = resolveCustomerProfileHierarchy({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValues: [],
            attributeValueAssignments: [
                makeAssignment("sector", "sector-assignment"),
                makeAssignment("production_group", "group-assignment"),
            ],
        })

        expect(hierarchy.sectorValueId).toBe("sector-assignment")
        expect(hierarchy.productionGroupValueId).toBe("group-assignment")
    })

    it("kullanım alanlarını iki kaynaktan birleştirir ve tekilleştirir", () => {
        const hierarchy = resolveCustomerProfileHierarchy({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValues: [{ id: "area-1" }, { id: "area-2" }],
            attributeValueAssignments: [
                makeAssignment("usage_area", "area-2"),
                makeAssignment("usage_area", "area-3"),
            ],
        })

        expect(hierarchy.usageAreaValueIds).toEqual(["area-1", "area-2", "area-3"])
    })

    it("hiyerarşi dışındaki attribute atamalarını yok sayar", () => {
        const hierarchy = resolveCustomerProfileHierarchy({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValues: [],
            attributeValueAssignments: [makeAssignment("material_type", "material-1")],
        })

        expect(hierarchy).toEqual({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValueIds: [],
        })
    })
})

describe("buildCustomerProfileProductWhereClauses", () => {
    it("profil boşsa hiç kural üretmez — eşleşme aranmaz", () => {
        const clauses = buildCustomerProfileProductWhereClauses({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValueIds: [],
        })

        expect(clauses).toEqual([])
    })

    it("her profil seviyesi için ayrı bir OR kuralı üretir", () => {
        const clauses = buildCustomerProfileProductWhereClauses({
            sectorValueId: "sector-1",
            productionGroupValueId: "group-1",
            usageAreaValueIds: ["area-1"],
        })

        expect(clauses).toHaveLength(3)
    })

    it("kullanım alanı kuralı doğrudan usageAreaValueId üzerinden eşleşir", () => {
        const [clause] = buildCustomerProfileProductWhereClauses({
            sectorValueId: null,
            productionGroupValueId: null,
            usageAreaValueIds: ["area-1", "area-2"],
        })

        expect(clause).toEqual({
            industrialUsages: {
                some: { usageAreaValueId: { in: ["area-1", "area-2"] } },
            },
        })
    })

    it("sektör kuralı ürünün alt seviyelerinden de eşleşmeye izin verir", () => {
        const [clause] = buildCustomerProfileProductWhereClauses({
            sectorValueId: "sector-1",
            productionGroupValueId: null,
            usageAreaValueIds: [],
        })

        const orBranches = (clause.industrialUsages as { some: { OR: unknown[] } }).some.OR

        // doğrudan sektör + üretim grubu üzerinden + kullanım alanı üzerinden
        expect(orBranches).toHaveLength(3)
    })
})
