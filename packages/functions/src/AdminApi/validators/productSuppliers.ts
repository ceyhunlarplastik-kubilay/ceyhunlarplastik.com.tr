import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductSupplierValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            supplierId: z.uuid(),
            catalogCode: z.string().min(1).max(5),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productId", "supplierId", "catalogCode"],
    }
)

export const getProductSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteProductSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateProductSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            catalogCode: z.string().min(1).max(5).optional(),
        })
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

// Response Validators
// TODO: Check this validators
/* export const productSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productSupplier: z.object({
                    id: z.uuid(),
                    productId: z.uuid(),
                    supplierId: z.uuid(),
                    catalogCode: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                })
            })
        })
    }).loose()
)

export const listProductSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        productId: z.uuid(),
                        supplierId: z.uuid(),
                        catalogCode: z.string(),
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
) */