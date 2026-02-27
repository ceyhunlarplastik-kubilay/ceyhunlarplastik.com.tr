import { z } from "zod"
import { categorySchema } from "@/functions/AdminApi/validators/categories"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

// --- Shared Schemas ---
const productSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string(),
    categoryId: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    category: categorySchema, // ✅ BUNU EKLEDİK
})

/* ===========================
   REQUEST VALIDATORS
=========================== */

export const createProductValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            categoryId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "categoryId"],
    }
)

export const updateProductValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            code: z.string().min(1).optional(),
            name: z.string().min(1).optional(),
            categoryId: z.uuid().optional(),
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

/* ===========================
   RESPONSE VALIDATORS
=========================== */

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