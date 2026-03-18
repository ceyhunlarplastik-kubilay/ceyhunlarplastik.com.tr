import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const measurementCodeValues = [
    "D",
    "D1",
    "D2",
    "R",
    "R1",
    "R2",
    "L",
    "L1",
    "L2",
    "T",
    "A",
    "W",
    "H",
    "H1",
    "H2",
    "PT",
    "M",
    "R_L",
] as const

export const createMeasurementTypeValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.enum(measurementCodeValues),
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
            code: z.enum(measurementCodeValues).optional(),
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
