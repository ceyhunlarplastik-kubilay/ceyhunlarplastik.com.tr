import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductAttributeValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.string().min(2).max(100),
            name: z.string().min(2).max(100),
            displayOrder: z.number().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    }
)

export const getProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            code: z.string().min(2).max(100).optional(),
            name: z.string().min(2).max(100).optional(),
            displayOrder: z.number().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

// Response Validators
export const productAttributeSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const productAttributeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productAttribute: productAttributeSchema,
            })
        })
    }).loose()
)

export const listProductAttributesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productAttributeSchema),
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





const productAttributeFilterSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    values: z.array(
        z.object({
            id: z.uuid(),
            name: z.string(),
            slug: z.string(),
            parentValueId: z.uuid().nullable().optional(),
            assets: z.array(
                z.object({
                    id: z.uuid(),
                    key: z.string(),
                    mimeType: z.string(),
                    type: z.string(),
                    role: z.string(),
                    url: z.string(),
                }).loose()
            ).optional(),
        })
    )
})

export const listAttributesWithValuesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productAttributeFilterSchema)
            })
        })
    }).loose()
)
