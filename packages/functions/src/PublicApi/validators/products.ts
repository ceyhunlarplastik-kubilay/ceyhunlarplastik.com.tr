import { z } from "zod"
import { categorySchema } from "@/functions/PublicApi/validators/categories";
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

export const slugValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            slug: z.string(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

// --- Shared schemas (recommended) ---
const productSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string(),
    categoryId: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    category: categorySchema,
})

// Response Validators
export const listProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productSchema),
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

export const productResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                product: productSchema,
            }),
        }),
    }).loose()
)