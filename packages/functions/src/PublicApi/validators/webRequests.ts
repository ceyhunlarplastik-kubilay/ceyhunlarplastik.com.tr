import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const webRequestItemSchema = z.object({
    productId: z.string().min(1),
    productSlug: z.string().optional(),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    variantKey: z.string().min(1),
    variantId: z.string().optional(),
    variantFullCode: z.string().nullable().optional(),
    quantity: z.number().int().min(1),
})

export const createWebRequestValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(2).max(200),
            email: z.email().max(320),
            phone: z.string().min(7).max(40).optional(),
            message: z.string().max(5000).optional(),
            items: z.array(webRequestItemSchema).min(1),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name", "email", "items"],
    }
)

const webRequestResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    items: z.any(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const webRequestResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                request: webRequestResponseSchema,
            }),
        }),
    }).loose()
)

