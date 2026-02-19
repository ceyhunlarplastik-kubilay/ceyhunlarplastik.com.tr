import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductMeasurementValidator = validatorWrapper(
    z.object({
        body: z.object({
            variantId: z.uuid(),
            measurementTypeId: z.uuid(),
            value: z.number(),
            label: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["variantId", "measurementTypeId", "value"],
    }
)

export const updateProductMeasurementValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            variantId: z.uuid().optional(),
            measurementTypeId: z.uuid().optional(),
            value: z.number().optional(),
            label: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

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
