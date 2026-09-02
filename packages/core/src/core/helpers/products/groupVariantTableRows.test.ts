import { describe, expect, it } from "vitest"

import { groupVariantTableRows } from "./groupVariantTableRows"

const mt = (id: string, displayOrder = 0) => ({ id, displayOrder, code: id, name: id })

/** values: [typeId, value] veya [typeId, value, isRequired] */
const row = (
    id: string,
    fullCode: string,
    values: Array<[string, number] | [string, number, boolean]>,
    colorId: string | null,
    materialIds: string[] = [],
) => ({
    id,
    fullCode,
    measurements: values.map(([typeId, value, isRequired], index) => ({
        id: `${id}-m${index}`,
        label: "",
        value,
        isRequired: isRequired ?? true,
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

    it("gruplanmış satır tedarikçi alanı taşımaz (public/portal)", () => {
        const rows = groupVariantTableRows([row("v1", "10.5.1.V1", [["R", 10]], "black")])
        expect(rows[0]).not.toHaveProperty("suppliers")
    })

    it("renksiz varyantta çökmez", () => {
        const rows = groupVariantTableRows([row("v1", "10.5.1.V1", [["R", 10]], null)])
        expect(rows[0].colors).toEqual([])
        expect(rows[0].variants[0].colorId).toBeNull()
    })

    describe("requiredMeasurementsOnly", () => {
        // 1.23: R (zorunlu), D (zorunlu), H (zorunlu DEĞİL). Sanay kataloğundan
        // R20/D5/H17, Özgen kataloğunda H yok → R20/D5. Zorunlulara göre AYNI.
        const withH = row("v1", "1.23.1.V1", [["R", 20], ["D", 5], ["H", 17, false]], "black")
        const withoutH = row("v2", "1.23.2.V1", [["R", 20], ["D", 5]], "black", ["bak"])

        it("varsayılan modda H farkı iki ayrı satır üretir (bugünkü davranış)", () => {
            expect(groupVariantTableRows([withH, withoutH])).toHaveLength(2)
        })

        it("zorunlu ölçüleri aynı olan varyantları TEK satırda birleştirir", () => {
            const rows = groupVariantTableRows([withH, withoutH], { requiredMeasurementsOnly: true })

            expect(rows).toHaveLength(1)
            // Satır yalnız zorunlu ölçüleri taşır — opsiyonel H düşer.
            expect(rows[0].measurements.map((m: any) => m.measurementType.code)).toEqual(["R", "D"])
            expect(rows[0].fullCodes).toEqual(["1.23.1.V1", "1.23.2.V1"])
            expect(rows[0].variants).toHaveLength(2)
            // Her iki kaynağın hammaddesi birleşir.
            expect(rows[0].materials.map((m: any) => m.id)).toEqual(["bak"])
        })

        it("zorunlu ölçüsü farklı olanları yine ayrı tutar", () => {
            const rows = groupVariantTableRows(
                [
                    withH,
                    row("v3", "1.23.3.V1", [["R", 30], ["D", 5], ["H", 17, false]], "black"),
                ],
                { requiredMeasurementsOnly: true },
            )
            expect(rows).toHaveLength(2)
        })
    })
})
