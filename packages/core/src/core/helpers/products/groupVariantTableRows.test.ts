import { describe, expect, it } from "vitest"

import { groupVariantTableRows } from "./groupVariantTableRows"

const mt = (id: string, displayOrder = 0) => ({ id, displayOrder, code: id, name: id })

const row = (
    id: string,
    fullCode: string,
    values: Array<[string, number]>,
    colorId: string | null,
    materialIds: string[] = [],
) => ({
    id,
    fullCode,
    measurements: values.map(([typeId, value], index) => ({
        id: `${id}-m${index}`,
        label: "",
        value,
        measurementType: mt(typeId, index),
    })),
    color: colorId ? { id: colorId } : null,
    materials: materialIds.map((materialId) => ({ id: materialId })),
})

describe("groupVariantTableRows", () => {
    it("aynı ölçünün versiyonlarını TEK satırda toplar", () => {
        const rows = groupVariantTableRows([
            row("v1", "10.5.1.V1", [["R", 10]], "black"),
            row("v2", "10.5.1.V2", [["R", 10]], "green"),
        ])

        expect(rows).toHaveLength(1)
        expect(rows[0].colors.map((c: any) => c.id)).toEqual(["black", "green"])
        expect(rows[0].fullCodes).toEqual(["10.5.1.V1", "10.5.1.V2"])
        expect(rows[0].variants).toHaveLength(2)
    })

    it("farklı ölçüleri ayrı satır yapar", () => {
        const rows = groupVariantTableRows([
            row("v1", "10.5.1.V1", [["R", 10]], "black"),
            row("v2", "10.5.2.V1", [["R", 20]], "black"),
        ])
        expect(rows).toHaveLength(2)
    })

    it("çok ölçülü kombinasyonu tek anahtar sayar", () => {
        const rows = groupVariantTableRows([
            row("v1", "10.5.1.V1", [["R", 10], ["D", 4]], "black"),
            row("v2", "10.5.1.V2", [["R", 10], ["D", 4]], "green"),
            row("v3", "10.5.2.V1", [["R", 10], ["D", 6]], "black"),
        ])
        expect(rows).toHaveLength(2)
        expect(rows[0].variants).toHaveLength(2)
    })

    it("hammaddeyi tekilleştirerek biriktirir", () => {
        const rows = groupVariantTableRows([
            row("v1", "10.5.1.V1", [["R", 10]], "black", ["pp"]),
            row("v2", "10.5.1.V2", [["R", 10]], "green", ["pp", "bak"]),
        ])
        expect(rows[0].materials.map((m: any) => m.id)).toEqual(["pp", "bak"])
    })

    it("çağıranın SIRASINI korur — yeniden sıralamaz", () => {
        // Sunucu `size.code`'a göre sıralı getiriyor; kod küçükten büyüğe atanmış
        // durumda. Burada ham değere göre yeniden sıralamak çok ölçülü üründe
        // kod sırasından ayrışmaya yol açardı.
        const rows = groupVariantTableRows([
            row("v1", "10.5.2.V1", [["R", 30]], "black"),
            row("v2", "10.5.1.V1", [["R", 10]], "black"),
        ])
        expect(rows.map((r) => r.fullCodes[0])).toEqual(["10.5.2.V1", "10.5.1.V1"])
    })

    it("tedarikçi alanı BOŞ üretilir — tablo bunu kapı olarak okuyor", () => {
        const rows = groupVariantTableRows([row("v1", "10.5.1.V1", [["R", 10]], "black")])
        expect(rows[0].suppliers).toEqual([])
    })

    it("renksiz varyantta çökmez", () => {
        const rows = groupVariantTableRows([row("v1", "10.5.1.V1", [["R", 10]], null)])
        expect(rows[0].colors).toEqual([])
        expect(rows[0].variants[0].colorId).toBeNull()
    })
})
