import { describe, expect, it } from "vitest"

import { flattenProductVariantStructure, withFlatVariantStructure } from "./flattenVariantStructure"

/** Repository'lerin döndürdüğü HAM ilişki şekli. */
function rawVariant() {
    return {
        id: "var-1",
        fullCode: "10.5.3.V1",
        size: {
            id: "size-1",
            code: 3,
            values: [{
                id: "sv-1",
                value: 12,
                requirement: {
                    id: "req-1",
                    label: "Elcik Çapı",
                    unit: "cm",
                    measurementType: { id: "mt-r", code: "R", name: "Çap", baseUnit: "mm" },
                },
            }],
        },
        version: {
            id: "ver-1",
            code: 1,
            colorId: "color-1",
            color: { id: "color-1", name: "Siyah" },
            materials: [{ id: "mat-pp", name: "Polipropilen" }],
        },
    }
}

describe("flattenProductVariantStructure", () => {
    it("size.values'ı düz measurements'a çevirir", () => {
        const flat = flattenProductVariantStructure(rawVariant())
        expect(flat.measurements).toEqual([{
            id: "sv-1",
            value: 12,
            label: "Elcik Çapı",
            unit: "cm",
            measurementType: { id: "mt-r", code: "R", name: "Çap", baseUnit: "mm" },
        }])
    })

    it("renk ve hammaddeyi version'dan yukarı çeker", () => {
        const flat = flattenProductVariantStructure(rawVariant())
        expect(flat.colorId).toBe("color-1")
        expect(flat.color).toEqual({ id: "color-1", name: "Siyah" })
        expect(flat.materials).toHaveLength(1)
    })

    it("kod segmentlerini türetir", () => {
        const flat = flattenProductVariantStructure(rawVariant())
        expect(flat.sizeCode).toBe(3)
        expect(flat.versionCode).toBe("V1")
    })

    it("şablonda birim yoksa ölçü tipinin taban birimine düşer", () => {
        const variant = rawVariant()
        variant.size.values[0].requirement.unit = null as unknown as string
        expect(flattenProductVariantStructure(variant).measurements[0].unit).toBe("mm")
    })

    it("eksik ilişkilerde çökmez", () => {
        // İlişki include EDİLMEDİYSE (bazı sorgular size/version çekmez) sessizce
        // boş dönmeli — bu yardımcı hata fırlatırsa tüm yanıt düşer.
        expect(flattenProductVariantStructure({ id: "x" })).toEqual({
            sizeCode: null,
            versionCode: null,
            colorId: null,
            color: null,
            materials: [],
            measurements: [],
        })
        expect(flattenProductVariantStructure(null)).toMatchObject({ measurements: [] })
    })
})

describe("withFlatVariantStructure", () => {
    it("ham alanları koruyup düz alanları ekler", () => {
        const result = withFlatVariantStructure(rawVariant())
        expect(result.fullCode).toBe("10.5.3.V1")
        expect(result.measurements).toHaveLength(1)
        expect(result.versionCode).toBe("V1")
    })

    it("girdiyi mutasyona uğratmaz", () => {
        const variant = rawVariant()
        withFlatVariantStructure(variant)
        expect(variant).not.toHaveProperty("measurements")
    })
})
