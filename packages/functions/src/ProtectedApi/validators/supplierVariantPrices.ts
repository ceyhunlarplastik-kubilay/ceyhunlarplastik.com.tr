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

export const updateSupplierProfileValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(2).max(100).optional(),
            contactName: z.string().min(2).max(100).optional(),
            phone: z.string().min(5).max(50).optional(),
            address: z.string().min(2).max(2000).optional(),
            taxNumber: z.string().min(2).max(50).optional(),
            defaultPaymentTermDays: z.number().int().min(0).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
    }
)

export const updateSupplierVariantPriceValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            price: z.number().nonnegative(),
            operationalCostRate: z.number().min(0).max(1000).optional(),
            netCost: z.number().nonnegative().optional(),
            profitRate: z.number().min(0).max(1000).optional(),
            listPrice: z.number().nonnegative().optional(),
            paymentTermDays: z.number().int().min(0).optional(),
            supplierVariantCode: z.string().max(120).optional(),
            supplierNote: z.string().max(2000).optional(),
            minOrderQty: z.number().int().min(0).optional(),
            stockQty: z.number().int().min(0).optional(),
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
    price: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    operationalCostRate: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    netCost: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    profitRate: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    listPrice: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    paymentTermDays: z.number().nullable().optional(),
    supplierVariantCode: z.string().nullable().optional(),
    supplierNote: z.string().nullable().optional(),
    minOrderQty: z.number().nullable().optional(),
    stockQty: z.number().nullable().optional(),
    pricingUpdatedAt: z.string().nullable().optional(),
    availabilityUpdatedAt: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
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

export const listSupplierProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        code: z.string(),
                        name: z.string(),
                        slug: z.string(),
                        categoryId: z.uuid(),
                        createdAt: z.string(),
                        updatedAt: z.string(),
                        variantCount: z.number(),
                        category: z.object({
                            id: z.uuid(),
                            code: z.number(),
                            name: z.string(),
                            slug: z.string(),
                        }).loose(),
                        assets: z.array(z.object({
                            id: z.uuid(),
                            role: z.string(),
                            url: z.string(),
                        }).loose()),
                    }).loose()
                ),
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

export const supplierProfileResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                supplier: z.object({
                    id: z.uuid(),
                    name: z.string(),
                    contactName: z.string().nullable().optional(),
                    phone: z.string().nullable().optional(),
                    address: z.string().nullable().optional(),
                    taxNumber: z.string().nullable().optional(),
                    defaultPaymentTermDays: z.number().nullable().optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }).loose().nullable(),
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
