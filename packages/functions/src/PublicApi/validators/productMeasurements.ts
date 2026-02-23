import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

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

// Response Validatotors
const measurementTypeSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    code: z.string(),
    baseUnit: z.string(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const productMeasurementSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    measurementTypeId: z.uuid(),
    value: z.number(),
    label: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    measurementType: measurementTypeSchema,
})

export const productMeasurementResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productMeasurement: productMeasurementSchema,
            }),
        }),
    }).loose()
)

export const listProductMeasurementsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productMeasurementSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)