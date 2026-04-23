import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const prismaDecimalSchema = z.object({
    s: z.number(),
    e: z.number(),
    d: z.array(z.number()),
}).loose()

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

export const updateSupplierVariantPriceValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            price: z.number().nonnegative(),
            currency: z.string().min(3).max(3).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["price"],
    }
)

const supplierVariantPriceSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    supplierId: z.uuid(),
    isActive: z.boolean(),
    price: z.union([z.number(), z.string(), prismaDecimalSchema]),
    currency: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const supplierVariantPriceResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productVariantSupplier: supplierVariantPriceSchema,
            }),
        }),
    }).loose()
)

export const listSupplierVariantPricesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(supplierVariantPriceSchema),
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
