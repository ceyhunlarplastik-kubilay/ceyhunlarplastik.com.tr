import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
const localeSchema = z.enum(["tr", "en"])

const colorSchema = z.object({
    id: z.uuid(),
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
    code: z.string(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    hex: z_hex,
    rgbR: z.number().min(0).max(255).optional(),
    rgbG: z.number().min(0).max(255).optional(),
    rgbB: z.number().min(0).max(255).optional(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            locale: localeSchema.optional(),
        }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

// Response Validators
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
