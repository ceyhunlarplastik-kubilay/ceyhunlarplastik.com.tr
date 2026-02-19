import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductVariantSupplierValidator = validatorWrapper(
    z.object({
        body: z.object({
            variantId: z.uuid(),
            supplierId: z.uuid(),
            isActive: z.boolean().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["variantId", "supplierId"],
    }
)

export const updateProductVariantSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            variantId: z.uuid().optional(),
            supplierId: z.uuid().optional(),
            isActive: z.boolean().optional(),
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
