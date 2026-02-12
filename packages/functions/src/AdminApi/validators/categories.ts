import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createCategoryValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.coerce.number().int().positive(),
            name: z.string().min(2).max(100),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    }
)

export const getCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(2).max(100),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["name"],
    }
)

// Response Validators
export const categoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                category: z.object({
                    id: z.uuid(),
                    code: z.number(),
                    name: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                })
            })
        })
    }).loose()
)

export const listCategoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        code: z.number(),
                        name: z.string(),
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