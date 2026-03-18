import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductAttributeValueValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(1),
            attributeId: z.uuid(),
            displayOrder: z.number().optional()
        })
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name", "attributeId"]
    }
)

export const updateProductAttributeValueValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        }),
        body: z.object({
            name: z.string().optional(),
            displayOrder: z.number().optional()
        })
    }),
    {
        requiredRootFields: ["pathParameters", "body"]
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        })
    }),
    {
        requiredRootFields: ["pathParameters"]
    }
)
