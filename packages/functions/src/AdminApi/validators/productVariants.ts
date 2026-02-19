import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const variantSupplierSchema = z.object({
    id: z.uuid(),
    isActive: z.boolean().optional(),
})

export const createProductVariantValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            suppliers: z.array(variantSupplierSchema).optional(),
            versionCode: z.string().min(1),
            supplierCode: z.string().min(1),
            name: z.string().min(1),
            colorId: z.uuid().optional(),
            materialIds: z.array(z.uuid()).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productId", "versionCode", "supplierCode", "name"],
    }
)

export const updateProductVariantValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            productId: z.uuid().optional(),
            suppliers: z.array(variantSupplierSchema).min(1).optional(),
            versionCode: z.string().min(1).optional(),
            supplierCode: z.string().min(1).optional(),
            name: z.string().min(1).optional(),
            colorId: z.uuid().optional(),
            materialIds: z.array(z.uuid()).optional(),
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
