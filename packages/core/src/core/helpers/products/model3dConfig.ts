import { z } from "zod"

const axisSchema = z.enum(["x", "y", "z"])

const model3dScaleRuleSchema = z.object({
    kind: z.literal("scale"),
    node: z.string().trim().min(1).max(255),
    axis: axisSchema,
}).strict()

const model3dTranslateRuleSchema = z.object({
    kind: z.literal("translate"),
    node: z.string().trim().min(1).max(255),
    axis: axisSchema,
    /** Ölçü farkının node hareketine etkisi. Negatif değer ters yönü ifade eder. */
    factor: z.number().finite().default(1),
}).strict()

export const productModel3dTransformRuleSchema = z.discriminatedUnion("kind", [
    model3dScaleRuleSchema,
    model3dTranslateRuleSchema,
])

export const productModel3dParameterSchema = z.object({
    measurementCode: z.string().trim().min(1).max(32),
    /** ProductMeasurement değerleriyle aynı birimde, v1 için milimetre. */
    baseValue: z.number().finite().positive(),
    min: z.number().finite().positive().optional(),
    max: z.number().finite().positive().optional(),
    rules: z.array(productModel3dTransformRuleSchema).min(1).max(100),
}).strict().superRefine((parameter, ctx) => {
    if (parameter.min !== undefined && parameter.max !== undefined && parameter.min > parameter.max) {
        ctx.addIssue({
            code: "custom",
            path: ["min"],
            message: "min must be less than or equal to max",
        })
    }

    if (parameter.min !== undefined && parameter.baseValue < parameter.min) {
        ctx.addIssue({
            code: "custom",
            path: ["baseValue"],
            message: "baseValue must be greater than or equal to min",
        })
    }

    if (parameter.max !== undefined && parameter.baseValue > parameter.max) {
        ctx.addIssue({
            code: "custom",
            path: ["baseValue"],
            message: "baseValue must be less than or equal to max",
        })
    }
})

const pbrMaterialPresetSchema = z.object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    metalness: z.number().finite().min(0).max(1).optional(),
    roughness: z.number().finite().min(0).max(1).optional(),
    transmission: z.number().finite().min(0).max(1).optional(),
    opacity: z.number().finite().min(0).max(1).optional(),
}).strict()

export const productModel3dMaterialSlotSchema = z.object({
    id: z.string().trim().min(1).max(100),
    materialNames: z.array(z.string().trim().min(1).max(255)).min(1).max(50),
    colorFromVariant: z.boolean().default(true),
    /** Product Material.code değerine göre uygulanacak PBR görünümü. */
    materialPresets: z.record(z.string(), pbrMaterialPresetSchema).default({}),
}).strict()

export const productModel3dAnimationSchema = z.object({
    clipName: z.string().trim().min(1).max(255),
    label: z.string().trim().min(1).max(255).optional(),
}).strict()

/**
 * Parametrik GLB sözleşmesi v1.
 *
 * GLB metre kullanır; ürün varyant ölçüleri milimetredir. `scale` kuralı node'u
 * baseValue oranıyla kendi pivotundan ölçekler. `translate` kuralı hedef-temel
 * farkını metreye çevirip factor ile node'un yerel eksenine uygular.
 */
export const productModel3dConfigSchema = z.object({
    version: z.literal(1),
    renderer: z.literal("r3f-parametric"),
    measurementUnit: z.literal("millimeter").default("millimeter"),
    parameters: z.array(productModel3dParameterSchema).min(1).max(50),
    materialSlots: z.array(productModel3dMaterialSlotSchema).max(50).default([]),
    animations: z.array(productModel3dAnimationSchema).max(50).default([]),
}).strict().superRefine((config, ctx) => {
    const parameterCodes = new Set<string>()
    for (const [index, parameter] of config.parameters.entries()) {
        if (parameterCodes.has(parameter.measurementCode)) {
            ctx.addIssue({
                code: "custom",
                path: ["parameters", index, "measurementCode"],
                message: "measurementCode must be unique",
            })
        }
        parameterCodes.add(parameter.measurementCode)
    }

    const slotIds = new Set<string>()
    for (const [index, slot] of config.materialSlots.entries()) {
        if (slotIds.has(slot.id)) {
            ctx.addIssue({
                code: "custom",
                path: ["materialSlots", index, "id"],
                message: "material slot id must be unique",
            })
        }
        slotIds.add(slot.id)
    }
})

export type ProductModel3dConfig = z.infer<typeof productModel3dConfigSchema>
export type ProductModel3dParameter = z.infer<typeof productModel3dParameterSchema>
export type ProductModel3dTransformRule = z.infer<typeof productModel3dTransformRuleSchema>

export type ProductModel3dGltfInventory = {
    nodeNames: Iterable<string>
    materialNames: Iterable<string>
    animationNames: Iterable<string>
}

export function parseProductModel3dConfig(value: unknown): ProductModel3dConfig | null {
    const parsed = productModel3dConfigSchema.safeParse(value)
    return parsed.success ? parsed.data : null
}

export function validateProductModel3dConfigReferences(
    config: ProductModel3dConfig,
    inventory: ProductModel3dGltfInventory,
): string[] {
    const nodeNames = new Set(inventory.nodeNames)
    const materialNames = new Set(inventory.materialNames)
    const animationNames = new Set(inventory.animationNames)
    const issues: string[] = []

    for (const parameter of config.parameters) {
        for (const rule of parameter.rules) {
            if (!nodeNames.has(rule.node)) {
                issues.push(`Parametre ${parameter.measurementCode} bilinmeyen node kullanıyor: ${rule.node}`)
            }
        }
    }

    for (const slot of config.materialSlots) {
        for (const materialName of slot.materialNames) {
            if (!materialNames.has(materialName)) {
                issues.push(`Materyal slotu ${slot.id} bilinmeyen materyal kullanıyor: ${materialName}`)
            }
        }
    }

    for (const animation of config.animations) {
        if (!animationNames.has(animation.clipName)) {
            issues.push(`Bilinmeyen animasyon klibi: ${animation.clipName}`)
        }
    }

    return issues
}
