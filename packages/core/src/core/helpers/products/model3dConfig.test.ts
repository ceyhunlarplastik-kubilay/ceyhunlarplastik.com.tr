import { describe, expect, it } from "vitest"

import {
    parseProductModel3dConfig,
    productModel3dConfigSchema,
    validateProductModel3dConfigReferences,
} from "./model3dConfig"

const validConfig = {
    version: 1,
    renderer: "r3f-parametric",
    measurementUnit: "millimeter",
    parameters: [
        {
            measurementCode: "L",
            baseValue: 100,
            min: 80,
            max: 160,
            rules: [
                { kind: "scale", node: "L_STRETCH", axis: "x" },
                { kind: "translate", node: "L_END", axis: "x", factor: 1 },
            ],
        },
    ],
    materialSlots: [
        {
            id: "body",
            materialNames: ["Body"],
            colorFromVariant: true,
            materialPresets: {
                PP: { roughness: 0.72, metalness: 0 },
            },
        },
    ],
    animations: [{ clipName: "Assembly" }],
} as const

describe("productModel3dConfigSchema", () => {
    it("parses a valid v1 configuration", () => {
        expect(productModel3dConfigSchema.parse(validConfig)).toEqual(validConfig)
        expect(parseProductModel3dConfig(validConfig)?.parameters[0]?.measurementCode).toBe("L")
    })

    it("rejects invalid parameter ranges and duplicate measurement codes", () => {
        const parsed = productModel3dConfigSchema.safeParse({
            ...validConfig,
            parameters: [
                { ...validConfig.parameters[0], min: 120, max: 110 },
                validConfig.parameters[0],
            ],
        })

        expect(parsed.success).toBe(false)
    })

    it("returns null instead of exposing an invalid public configuration", () => {
        expect(parseProductModel3dConfig({ version: 1, renderer: "r3f-parametric" })).toBeNull()
    })
})

describe("validateProductModel3dConfigReferences", () => {
    it("accepts referenced nodes, materials, and animations", () => {
        const config = productModel3dConfigSchema.parse(validConfig)

        expect(validateProductModel3dConfigReferences(config, {
            nodeNames: ["L_STRETCH", "L_END"],
            materialNames: ["Body"],
            animationNames: ["Assembly"],
        })).toEqual([])
    })

    it("reports missing GLB references", () => {
        const config = productModel3dConfigSchema.parse(validConfig)
        const issues = validateProductModel3dConfigReferences(config, {
            nodeNames: ["L_STRETCH"],
            materialNames: [],
            animationNames: [],
        })

        expect(issues).toEqual(expect.arrayContaining([
            expect.stringContaining("L_END"),
            expect.stringContaining("Body"),
            expect.stringContaining("Assembly"),
        ]))
    })
})
