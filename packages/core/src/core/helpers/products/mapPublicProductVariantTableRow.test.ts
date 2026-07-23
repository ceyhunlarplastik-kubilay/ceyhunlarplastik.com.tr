import { describe, expect, it } from "vitest"

import { mapPublicProductVariantTableRow } from "./mapPublicProductVariantTableRow"

const now = new Date("2026-07-23T12:00:00.000Z")

describe("mapPublicProductVariantTableRow", () => {
    it("localizes nested variant dictionary values and strips translation arrays", () => {
        const row = mapPublicProductVariantTableRow({
            id: "variant-1",
            productId: "product-1",
            name: "Variant",
            versionCode: "V1",
            supplierCode: "A",
            variantIndex: 1,
            fullCode: "P-1-V1-A-1",
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
                translations: [
                    {
                        id: "color-1-tr",
                        colorId: "color-1",
                        locale: "tr",
                        name: "Siyah",
                        createdAt: now,
                        updatedAt: now,
                    },
                    {
                        id: "color-1-en",
                        colorId: "color-1",
                        locale: "en",
                        name: "Black",
                        createdAt: now,
                        updatedAt: now,
                    },
                ],
            },
            materials: [{
                id: "material-1",
                code: "POM",
                name: "Poliasetal",
                createdAt: now,
                updatedAt: now,
                assets: [],
                translations: [
                    {
                        id: "material-1-tr",
                        materialId: "material-1",
                        locale: "tr",
                        name: "Poliasetal",
                        createdAt: now,
                        updatedAt: now,
                    },
                    {
                        id: "material-1-en",
                        materialId: "material-1",
                        locale: "en",
                        name: "Polyacetal",
                        createdAt: now,
                        updatedAt: now,
                    },
                ],
            }],
            measurements: [{
                id: "measurement-1",
                value: 12,
                label: "",
                measurementType: {
                    id: "measurement-type-1",
                    code: "D",
                    name: "Dış Çap",
                    baseUnit: "mm",
                    displayOrder: 0,
                    createdAt: now,
                    updatedAt: now,
                    translations: [
                        {
                            id: "measurement-type-1-tr",
                            measurementTypeId: "measurement-type-1",
                            locale: "tr",
                            name: "Dış Çap",
                            createdAt: now,
                            updatedAt: now,
                        },
                        {
                            id: "measurement-type-1-en",
                            measurementTypeId: "measurement-type-1",
                            locale: "en",
                            name: "Outside Diameter",
                            createdAt: now,
                            updatedAt: now,
                        },
                    ],
                },
            }],
            createdAt: now,
            updatedAt: now,
        }, "en")

        expect(row.color?.name).toBe("Black")
        expect(row.materials[0].name).toBe("Polyacetal")
        expect(row.measurements[0].measurementType.name).toBe("Outside Diameter")
        expect(row.color).not.toHaveProperty("translations")
        expect(row.materials[0]).not.toHaveProperty("translations")
        expect(row.measurements[0].measurementType).not.toHaveProperty("translations")
    })
})
