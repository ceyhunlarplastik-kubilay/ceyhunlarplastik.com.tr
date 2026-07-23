import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
const localeSchema = z.enum(["tr", "en"])
const dictionaryTranslationInputSchema = z.object({
    locale: localeSchema,
    name: z.string().min(1).max(100),
})
const dictionaryTranslationSchema = z.object({
    id: z.uuid(),
    locale: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createColorValidator = validatorWrapper(
    z.object({
        body: z.object({
            system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]).optional(),
            code: z.string().min(3).max(20),
            name: z.string().min(2).max(100),
            translations: z.array(dictionaryTranslationInputSchema).max(10).optional(),
            hex: z_hex,
            rgbR: z.number().min(0).max(255).optional(),
            rgbG: z.number().min(0).max(255).optional(),
            rgbB: z.number().min(0).max(255).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "hex"],
    }
)

export const getColorValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteColorValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateColorValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]).optional(),
            code: z.string().min(1).max(20).optional(),
            name: z.string().min(2).max(100).optional(),
            translations: z.array(dictionaryTranslationInputSchema).max(10).optional(),
            hex: z_hex.optional(),
            isActive: z.boolean().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

// Response Validators
const colorSchema = z.object({
    id: z.uuid(),
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
    code: z.string(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    translations: z.array(dictionaryTranslationSchema).optional(),
    hex: z_hex,
    rgbR: z.number().min(0).max(255).optional(),
    rgbG: z.number().min(0).max(255).optional(),
    rgbB: z.number().min(0).max(255).optional(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()


export const colorResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                color: colorSchema
            })
        })
    }).loose()
)

export const listColorResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(colorSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                })
            })
        })
    }).loose()
)
