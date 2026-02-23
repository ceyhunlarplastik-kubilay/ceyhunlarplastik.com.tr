import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createMeasurementTypeValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.enum(["D", "L", "T", "A", "W", "H"]),
            name: z.string().min(2).max(100),
            baseUnit: z.string().min(1).max(20),
            displayOrder: z.number().int().optional().default(0),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "baseUnit"],
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateMeasurementTypeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            code: z.enum(["D", "L", "T", "A", "W", "H"]).optional(),
            name: z.string().min(2).max(100).optional(),
            baseUnit: z.string().min(1).max(20).optional(),
            displayOrder: z.number().int().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        // requiredBodyFields: ["code", "name", "unit"],
    }
)

// Response Validators
export const measurementTypeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                measurementType: z.object({
                    id: z.uuid(),
                    code: z.string(),
                    name: z.string(),
                    baseUnit: z.string(),
                    displayOrder: z.number(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                })
            })
        })
    }).loose()
)

export const listMeasurementTypeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        code: z.string(),
                        name: z.string(),
                        baseUnit: z.string(),
                        displayOrder: z.number(),
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