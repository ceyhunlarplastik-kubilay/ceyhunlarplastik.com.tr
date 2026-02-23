import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
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
                color: z.object({
                    id: z.uuid(),
                    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
                    code: z.number(),
                    name: z.string(),
                    hex: z_hex,
                    rgbR: z.number().min(0).max(255).optional(),
                    rgbG: z.number().min(0).max(255).optional(),
                    rgbB: z.number().min(0).max(255).optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                })
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
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]),
                        code: z.number(),
                        name: z.string(),
                        hex: z_hex,
                        rgbR: z.number().min(0).max(255).optional(),
                        rgbG: z.number().min(0).max(255).optional(),
                        rgbB: z.number().min(0).max(255).optional(),
                        isActive: z.boolean(),
                        createdAt: z.string(),
                        updatedAt: z.string(),
                    })
                ),
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
