import { z } from "zod"

/**
 * ⚠️ BU ŞEMADA `.default()` KULLANMA.
 *
 * Şema iki yerde birden tüketiliyor: Zod `parse` (runtime) ve `z.toJSONSchema`
 * üzerinden ajv request/response validator'ları. Şema birçok noktada bir union'ın
 * altına giriyor — `discriminatedUnion` (`oneOf`) ve `.nullish()` (`anyOf`) gibi.
 * ajv composite bir alt şemadaki `default`'u UYGULAYAMAZ ve `strict: true` altında
 * derlemeyi tümden reddeder:
 *     strict mode: default is ignored for: data80.factor
 * Bu, validator'ı taşıyan actions.ts modülünü import anında patlatır; yani tek bir
 * `default` o dosyadaki TÜM endpoint'leri düşürür.
 *
 * Varsayılanlar bu yüzden tek yerde, `normalizeProductModel3dConfig` içinde
 * uygulanır; şema alanları `.optional()` kalır.
 */

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
    /**
     * Ölçü farkının node hareketine etkisi. Negatif değer ters yönü ifade eder.
     * Boş bırakılırsa normalizasyonda 1 uygulanır.
     */
    factor: z.number().finite().optional(),
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
    colorFromVariant: z.boolean().optional(),
    /** Product Material.code değerine göre uygulanacak PBR görünümü. */
    materialPresets: z.record(z.string(), pbrMaterialPresetSchema).optional(),
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
    measurementUnit: z.literal("millimeter").optional(),
    parameters: z.array(productModel3dParameterSchema).min(1).max(50),
    materialSlots: z.array(productModel3dMaterialSlotSchema).max(50).optional(),
    animations: z.array(productModel3dAnimationSchema).max(50).optional(),
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
    for (const [index, slot] of (config.materialSlots ?? []).entries()) {
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

/**
 * Tel üzerindeki (wire) biçim: şemadan doğrudan çıkan, varsayılanları henüz
 * uygulanmamış hâli. İstek gövdesi tipleri bunu kullanmalı — istemcinin
 * `factor` / `materialSlots` gibi alanları göndermeme hakkı var.
 */
export type ProductModel3dConfigInput = z.infer<typeof productModel3dConfigSchema>
export type ProductModel3dParameterInput = z.infer<typeof productModel3dParameterSchema>
export type ProductModel3dTransformRuleInput = z.infer<typeof productModel3dTransformRuleSchema>
export type ProductModel3dMaterialSlotInput = z.infer<typeof productModel3dMaterialSlotSchema>
export type ProductModel3dAnimation = z.infer<typeof productModel3dAnimationSchema>

/**
 * Normalize edilmiş biçim: varsayılanlar uygulanmış, render/hesap katmanının
 * gördüğü hâl. Alanlar zorunlu olduğu için tüketiciler `?? 1` / `?? []` yazmaz.
 */
export type ProductModel3dTransformRule =
    | Extract<ProductModel3dTransformRuleInput, { kind: "scale" }>
    | (Extract<ProductModel3dTransformRuleInput, { kind: "translate" }> & { factor: number })

export type ProductModel3dParameter = Omit<ProductModel3dParameterInput, "rules"> & {
    rules: ProductModel3dTransformRule[]
}

export type ProductModel3dMaterialSlot = ProductModel3dMaterialSlotInput & {
    colorFromVariant: boolean
    materialPresets: NonNullable<ProductModel3dMaterialSlotInput["materialPresets"]>
}

export type ProductModel3dConfig =
    Omit<ProductModel3dConfigInput, "measurementUnit" | "parameters" | "materialSlots" | "animations"> & {
        measurementUnit: "millimeter"
        parameters: ProductModel3dParameter[]
        materialSlots: ProductModel3dMaterialSlot[]
        animations: ProductModel3dAnimation[]
    }

export type ProductModel3dGltfInventory = {
    nodeNames: Iterable<string>
    materialNames: Iterable<string>
    animationNames: Iterable<string>
}

/**
 * Şemadaki `.default()` yerine geçen TEK nokta (nedeni için dosya başındaki nota
 * bak). Depoda eksik alanlarla duran eski konfigürasyonlar da buradan geçtiği
 * için okuma yolu geriye dönük uyumlu kalır.
 */
export function normalizeProductModel3dConfig(
    config: ProductModel3dConfigInput,
): ProductModel3dConfig {
    return {
        ...config,
        measurementUnit: config.measurementUnit ?? "millimeter",
        parameters: config.parameters.map((parameter) => ({
            ...parameter,
            rules: parameter.rules.map((rule) =>
                rule.kind === "translate" ? { ...rule, factor: rule.factor ?? 1 } : rule,
            ),
        })),
        materialSlots: (config.materialSlots ?? []).map((slot) => ({
            ...slot,
            colorFromVariant: slot.colorFromVariant ?? true,
            materialPresets: slot.materialPresets ?? {},
        })),
        animations: config.animations ?? [],
    }
}

export function parseProductModel3dConfig(value: unknown): ProductModel3dConfig | null {
    const parsed = productModel3dConfigSchema.safeParse(value)
    return parsed.success ? normalizeProductModel3dConfig(parsed.data) : null
}

/**
 * Normalize edilmemiş girdiyi de kabul eder: admin tarafı GLB'ye gömülü ham
 * konfigürasyonu doğrularken henüz normalizasyondan geçmemiş olabiliyor.
 */
export function validateProductModel3dConfigReferences(
    config: ProductModel3dConfigInput,
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

    for (const slot of config.materialSlots ?? []) {
        for (const materialName of slot.materialNames) {
            if (!materialNames.has(materialName)) {
                issues.push(`Materyal slotu ${slot.id} bilinmeyen materyal kullanıyor: ${materialName}`)
            }
        }
    }

    for (const animation of config.animations ?? []) {
        if (!animationNames.has(animation.clipName)) {
            issues.push(`Bilinmeyen animasyon klibi: ${animation.clipName}`)
        }
    }

    return issues
}
