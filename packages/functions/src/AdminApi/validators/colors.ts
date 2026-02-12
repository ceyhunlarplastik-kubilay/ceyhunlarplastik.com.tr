import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const z_hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)

export const createColorValidator = validatorWrapper(
    z.object({
        body: z.object({
            system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]).optional(),
            code: z.string().min(3).max(20),
            name: z.string().min(2).max(100),
            hex: z_hex,
            rgbR: z.number().min(0).max(255).optional(),
            rgbG: z.number().min(0).max(255).optional(),
            rgbB: z.number().min(0).max(255).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["system", "code", "name", "hex"],
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
            name: z.string().min(2).max(100).optional(),
            isActive: z.boolean().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["name", "isActive"],
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