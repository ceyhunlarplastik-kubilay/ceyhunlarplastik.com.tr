import { describe, expect, it } from "vitest"

import type { GroupedMeasurementOption } from "./groupedMeasurementOption"
import { resolveProduct3dVariantSelection } from "./resolveProduct3dVariantSelection"

const option = {
    key: "L:100",
    label: "L: 100",
    measurements: [],
    colors: [
        { id: "black", name: "Siyah", hex: "#000000" },
        { id: "white", name: "Beyaz", hex: "#ffffff" },
    ],
    materials: [
        { id: "pp", name: "PP", code: "PP" },
        { id: "pa", name: "PA", code: "PA" },
    ],
    suppliers: [],
    fullCodes: ["A", "B"],
    variants: [
        {
            id: "a",
            fullCode: "A",
            colorId: "black",
            materialIds: ["pp"],
        },
        {
            id: "b",
            fullCode: "B",
            colorId: "white",
            materialIds: ["pa"],
        },
    ],
} satisfies GroupedMeasurementOption

describe("resolveProduct3dVariantSelection", () => {
    it("resolves a valid exact color and material combination", () => {
        const result = resolveProduct3dVariantSelection([option], {
            measurementKey: option.key,
            colorId: "white",
            materialId: "pa",
        })

        expect(result?.variant?.id).toBe("b")
        expect(result?.selectedMaterialId).toBe("pa")
    })

    it("normalizes an invalid dependent material to the selected color", () => {
        const result = resolveProduct3dVariantSelection([option], {
            colorId: "black",
            materialId: "pa",
        })

        expect(result?.selectedMaterialId).toBe("pp")
        expect(result?.variant?.id).toBe("a")
    })

    it("treats a multi-material variant as one exact selectable combination", () => {
        const combinedOption: GroupedMeasurementOption = {
            ...option,
            materials: [
                { id: "pp", name: "PP", code: "PP" },
                { id: "pe", name: "PE", code: "PE" },
            ],
            variants: [{
                id: "combined",
                fullCode: "C",
                colorId: "black",
                materialIds: ["pe", "pp"],
            }],
        }

        const result = resolveProduct3dVariantSelection([combinedOption], {
            colorId: "black",
            materialId: "pe,pp",
        })

        expect(result?.selectedMaterialId).toBe("pe,pp")
        expect(result?.selectedMaterials.map((material) => material.id)).toEqual(["pp", "pe"])
        expect(result?.variant?.id).toBe("combined")
    })

    it("falls back to the first measurement option", () => {
        expect(resolveProduct3dVariantSelection([option], { measurementKey: "missing" })?.measurement.key)
            .toBe(option.key)
    })
})
