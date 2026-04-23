import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const webRequestItemSchema = z.object({
    productId: z.string(),
    productSlug: z.string().optional(),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    variantKey: z.string(),
    variantId: z.string().optional(),
    variantFullCode: z.string().nullable().optional(),
    quantity: z.number(),
}).loose()

const webRequestSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    items: z.array(webRequestItemSchema).or(z.any()),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listWebRequestsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(webRequestSchema),
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

const webRequestStatusEnum = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"])

export const updateWebRequestStatusValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.string().min(1),
        }),
        body: z.object({
            status: webRequestStatusEnum,
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["status"],
    }
)

export const updateWebRequestStatusResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                request: webRequestSchema,
            }),
        }),
    }).loose()
)
