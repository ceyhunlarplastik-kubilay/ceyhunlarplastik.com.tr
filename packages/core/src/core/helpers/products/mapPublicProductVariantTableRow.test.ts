import { describe, expect, it } from "vitest"

import { mapPublicProductVariantTableRow } from "./mapPublicProductVariantTableRow"

const now = new Date("2026-07-23T12:00:00.000Z")

const colorTranslations = [
    { id: "color-1-tr", colorId: "color-1", locale: "tr", name: "Siyah", createdAt: now, updatedAt: now },
    { id: "color-1-en", colorId: "color-1", locale: "en", name: "Black", createdAt: now, updatedAt: now },
]

const materialTranslations = [
    { id: "material-1-tr", materialId: "material-1", locale: "tr", name: "Poliasetal", createdAt: now, updatedAt: now },
    { id: "material-1-en", materialId: "material-1", locale: "en", name: "Polyacetal", createdAt: now, updatedAt: now },
]

const measurementTypeTranslations = [
    { id: "mt-1-tr", measurementTypeId: "measurement-type-1", locale: "tr", name: "Dış Çap", createdAt: now, updatedAt: now },
    { id: "mt-1-en", measurementTypeId: "measurement-type-1", locale: "en", name: "Outside Diameter", createdAt: now, updatedAt: now },
]

/** Yeni ilişki yapısı: ölçüler `size.values`, renk/hammadde `version` altında. */
function buildVariant() {
    return {
        id: "variant-1",
        productId: "product-1",
        name: "Variant",
        fullCode: "10.5.3.V1",
        size: {
            id: "size-1",
            code: 3,
            values: [{
                id: "size-value-1",
                value: 12,
                requirement: {
                    id: "req-1",
                    label: "Elcik Çapı",
                    unit: null,
                    translations: [
                        { id: "req-1-en", requirementId: "req-1", locale: "en", label: "Handle Diameter" },
                    ],
                    measurementType: {
                        id: "measurement-type-1",
                        code: "D",
                        name: "Dış Çap",
                        baseUnit: "mm",
                        displayOrder: 0,
                        createdAt: now,
                        updatedAt: now,
                        translations: measurementTypeTranslations,
                    },
                },
            }],
        },
        version: {
            id: "version-1",
            code: 1,
            colorId: "color-1",
            color: {
                id: "color-1",
                system: "RAL",
                code: "9005",
                name: "Siyah",
                hex: "#000000",
                rgbR: 0,
                rgbG: 0,
                rgbB: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
                translations: colorTranslations,
            },
            materials: [{
                id: "material-1",
                code: "POM",
                name: "Poliasetal",
                createdAt: now,
                updatedAt: now,
                assets: [],
                translations: materialTranslations,
            }],
        },
        createdAt: now,
        updatedAt: now,
    }
}

describe("mapPublicProductVariantTableRow", () => {
    it("localizes nested variant dictionary values and strips translation arrays", () => {
        const row = mapPublicProductVariantTableRow(buildVariant(), "en")

        expect(row.color?.name).toBe("Black")
        expect(row.materials[0].name).toBe("Polyacetal")
        expect(row.measurements[0].measurementType.name).toBe("Outside Diameter")
        expect(row.color).not.toHaveProperty("translations")
        expect(row.materials[0]).not.toHaveProperty("translations")
        expect(row.measurements[0].measurementType).not.toHaveProperty("translations")
    })

    it("size/version yapısını eski düz DTO şekline çevirir", () => {
        const row = mapPublicProductVariantTableRow(buildVariant(), "tr")

        // Okuyan yüzeyler hâlâ düz `measurements` / `color` / `materials` görür.
        expect(row.measurements).toHaveLength(1)
        expect(row.measurements[0].value).toBe(12)
        expect(row.colorId).toBe("color-1")
        expect(row.materials).toHaveLength(1)
    })

    it("kod segmentlerini yeni biçimde türetir", () => {
        const row = mapPublicProductVariantTableRow(buildVariant(), "tr")

        expect(row.fullCode).toBe("10.5.3.V1")
        expect(row.sizeCode).toBe(3)
        expect(row.versionCode).toBe("V1")
    })

    it("ölçü etiketi ürün modeline özeldir ve çevrilir", () => {
        // Aynı `D` kodu başka bir üründe "Burç Metriği" olabilir; etiket ölçü
        // TİPİNDEN değil ürün modelinin şablonundan gelir.
        expect(mapPublicProductVariantTableRow(buildVariant(), "tr").measurements[0].label).toBe("Elcik Çapı")
        expect(mapPublicProductVariantTableRow(buildVariant(), "en").measurements[0].label).toBe("Handle Diameter")
    })

    it("birim şablondan, yoksa ölçü tipinin taban biriminden gelir", () => {
        const variant = buildVariant()
        expect(mapPublicProductVariantTableRow(variant, "tr").measurements[0].unit).toBe("mm")

        variant.size.values[0].requirement.unit = "cm" as any
        expect(mapPublicProductVariantTableRow(variant, "tr").measurements[0].unit).toBe("cm")
    })

    it("public satır tedarikçi/fiyat bilgisi TAŞIMAZ", () => {
        const row = mapPublicProductVariantTableRow(buildVariant(), "tr")
        expect(row).not.toHaveProperty("variantSuppliers")
    })
})
