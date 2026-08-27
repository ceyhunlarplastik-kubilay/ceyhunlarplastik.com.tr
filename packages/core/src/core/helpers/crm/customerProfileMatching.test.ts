import { describe, expect, it } from "vitest"

import {
    buildCustomerProfileProductWhereClauses,
    buildProductProfileCustomerWhereClauses,
    collectMatchedProfileValues,
    collectProductProfileReach,
    resolveCustomerProfileHierarchy,
    type ProductIndustrialUsageSource,
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

/* -------------------------------------------------------------------------- */
/* TERS YÖN: ürün → müşteri                                                    */
/* -------------------------------------------------------------------------- */

function makeUsage(overrides: Partial<ProductIndustrialUsageSource> = {}): ProductIndustrialUsageSource {
    return {
        sectorValueId: null,
        productionGroupValue: null,
        usageAreaValue: null,
        ...overrides,
    }
}

function makeProductionGroupValue(id: string, parentValueId: string | null, code = "production_group") {
    return { id, parentValueId, attribute: { code } }
}

function makeUsageAreaValue(
    id: string,
    parentValueId: string | null,
    grandParentValueId: string | null,
    code = "usage_area",
) {
    return {
        id,
        parentValueId,
        attribute: { code },
        parentValue: parentValueId ? { parentValueId: grandParentValueId } : null,
    }
}

describe("collectProductProfileReach", () => {
    it("sektörü üç yoldan da toplar: doğrudan, üretim grubunun ebeveyni, kullanım alanının dedesi", () => {
        const reach = collectProductProfileReach([
            makeUsage({ sectorValueId: "sector-direct" }),
            makeUsage({ productionGroupValue: makeProductionGroupValue("group-1", "sector-via-group") }),
            makeUsage({ usageAreaValue: makeUsageAreaValue("area-1", "group-2", "sector-via-area") }),
        ])

        expect(reach.sectorValueIds.sort()).toEqual([
            "sector-direct",
            "sector-via-area",
            "sector-via-group",
        ])
    })

    it("üretim grubunu doğrudan ve kullanım alanının ebeveyninden toplar", () => {
        const reach = collectProductProfileReach([
            makeUsage({ productionGroupValue: makeProductionGroupValue("group-direct", "sector-1") }),
            makeUsage({ usageAreaValue: makeUsageAreaValue("area-1", "group-via-area", "sector-1") }),
        ])

        expect(reach.productionGroupValueIds.sort()).toEqual(["group-direct", "group-via-area"])
    })

    it("kullanım alanını doğrudan toplar ve tekrarları tekilleştirir", () => {
        const reach = collectProductProfileReach([
            makeUsage({ usageAreaValue: makeUsageAreaValue("area-1", "group-1", "sector-1") }),
            makeUsage({ usageAreaValue: makeUsageAreaValue("area-1", "group-1", "sector-1") }),
        ])

        expect(reach.usageAreaValueIds).toEqual(["area-1"])
    })

    /**
     * İleri yöndeki WHERE, üst seviyeye TIRMANAN dallarda attribute kodunu
     * kontrol ediyor; doğrudan eşleşen dallarda etmiyor. Ters yön bu ayrımı
     * birebir taklit etmek zorunda, yoksa iki ekran farklı sonuç verir.
     */
    it("yanlış attribute kodlu değerden üst seviyeye tırmanmaz ama doğrudan eşleşmeyi korur", () => {
        const reach = collectProductProfileReach([
            makeUsage({
                productionGroupValue: makeProductionGroupValue("group-1", "sector-1", "wrong_code"),
                usageAreaValue: makeUsageAreaValue("area-1", "group-2", "sector-2", "wrong_code"),
            }),
        ])

        expect(reach.sectorValueIds).toEqual([])
        expect(reach.productionGroupValueIds).toEqual(["group-1"])
        expect(reach.usageAreaValueIds).toEqual(["area-1"])
    })

    it("endüstriyel kullanımı olmayan ürün için boş erişim kümesi döner", () => {
        const reach = collectProductProfileReach([makeUsage()])

        expect(reach).toEqual({
            sectorValueIds: [],
            productionGroupValueIds: [],
            usageAreaValueIds: [],
        })
    })
})

describe("buildProductProfileCustomerWhereClauses", () => {
    it("boş erişim kümesinde hiç kural üretmez", () => {
        expect(
            buildProductProfileCustomerWhereClauses({
                sectorValueIds: [],
                productionGroupValueIds: [],
                usageAreaValueIds: [],
            }),
        ).toEqual([])
    })

    it("sektör/üretim grubunda atama satırına yalnız kolon BOŞSA düşer", () => {
        const [sectorClause, productionGroupClause] = buildProductProfileCustomerWhereClauses({
            sectorValueIds: ["sector-1"],
            productionGroupValueIds: ["group-1"],
            usageAreaValueIds: [],
        })

        expect(sectorClause.OR?.[1]).toMatchObject({ sectorValueId: null })
        expect(productionGroupClause.OR?.[1]).toMatchObject({ productionGroupValueId: null })
    })

    it("kullanım alanında iki kaynağı da koşulsuz OR'lar", () => {
        const [usageAreaClause] = buildProductProfileCustomerWhereClauses({
            sectorValueIds: [],
            productionGroupValueIds: [],
            usageAreaValueIds: ["area-1"],
        })

        expect(usageAreaClause.OR).toHaveLength(2)
        expect(usageAreaClause.OR?.[0]).toEqual({
            usageAreaValues: { some: { id: { in: ["area-1"] } } },
        })
        expect(usageAreaClause.OR?.[1]).not.toHaveProperty("usageAreaValues")
    })
})

describe("collectMatchedProfileValues", () => {
    const reach = {
        sectorValueIds: ["sector-1"],
        productionGroupValueIds: ["group-1"],
        usageAreaValueIds: ["area-1", "area-2"],
    }

    it("yalnız kesişen değerleri döndürür", () => {
        expect(
            collectMatchedProfileValues(
                {
                    sectorValueId: "sector-1",
                    productionGroupValueId: "group-other",
                    usageAreaValueIds: ["area-2", "area-other"],
                },
                reach,
            ),
        ).toEqual(["sector-1", "area-2"])
    })

    it("kesişim yoksa boş döner", () => {
        expect(
            collectMatchedProfileValues(
                { sectorValueId: null, productionGroupValueId: null, usageAreaValueIds: [] },
                reach,
            ),
        ).toEqual([])
    })
})

/**
 * SİMETRİ: iki yön aynı kuraldan türemeli. Müşteri profili ürünün erişim
 * kümesinde varsa, ileri yön de o ürünü o müşteri için seçmeli.
 */
describe("ileri ve ters yön simetrisi", () => {
    it("kullanım alanı zinciri her iki yönde de aynı üç seviyeyi üretir", () => {
        const reach = collectProductProfileReach([
            makeUsage({ usageAreaValue: makeUsageAreaValue("area-1", "group-1", "sector-1") }),
        ])

        // Ters yön: bu üç profil değerinin her biri ürüne ulaşır.
        expect(reach.sectorValueIds).toContain("sector-1")
        expect(reach.productionGroupValueIds).toContain("group-1")
        expect(reach.usageAreaValueIds).toContain("area-1")

        // İleri yön: aynı üç değer için de kural üretilir.
        for (const hierarchy of [
            { sectorValueId: "sector-1", productionGroupValueId: null, usageAreaValueIds: [] },
            { sectorValueId: null, productionGroupValueId: "group-1", usageAreaValueIds: [] },
            { sectorValueId: null, productionGroupValueId: null, usageAreaValueIds: ["area-1"] },
        ]) {
            expect(buildCustomerProfileProductWhereClauses(hierarchy)).toHaveLength(1)
        }
    })
})
