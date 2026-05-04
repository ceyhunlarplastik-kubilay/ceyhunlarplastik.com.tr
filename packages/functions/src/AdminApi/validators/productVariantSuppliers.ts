import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { supplierSchema } from "@/functions/AdminApi/validators/suppliers"

const prismaDecimalSchema = z.object({
    s: z.number(),
    e: z.number(),
    d: z.array(z.number()),
}).loose()

export const createProductVariantSupplierValidator = validatorWrapper(
    z.object({
        body: z.object({
            variantId: z.uuid(),
            supplierId: z.uuid(),
            isActive: z.boolean().optional(),
            price: z.number().nonnegative().optional(),
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
        requiredRootFields: ["body"],
        requiredBodyFields: ["variantId", "supplierId"],
    }
)

export const updateProductVariantSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            variantId: z.uuid().optional(),
            supplierId: z.uuid().optional(),
            isActive: z.boolean().optional(),
            price: z.number().nonnegative().optional(),
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

// Response Validators 
const variantSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    productId: z.uuid(),
    versionCode: z.string(),
    supplierCode: z.string(),
    variantIndex: z.number(),
    fullCode: z.string(),
    colorId: z.uuid().nullable(),
    product: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        slug: z.string(),
        categoryId: z.uuid(),
        category: z.object({
            id: z.uuid(),
            name: z.string(),
            slug: z.string(),
            code: z.number(),
        }).loose(),
    }).loose(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const productVariantSupplierSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    supplierId: z.uuid(),
    isActive: z.boolean(),
    price: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
    operationalCostRate: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
    netCost: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
    profitRate: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
    listPrice: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
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
    variant: variantSchema,
    supplier: supplierSchema,
}).loose()

export const productVariantSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productVariantSupplier: productVariantSupplierSchema
            })
        })
    }).loose()
)

export const bulkUpdateProductVariantSupplierPricingValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            supplierId: z.uuid().optional(),
            operationalCostRate: z.number().min(0).max(1000).optional(),
            profitRate: z.number().min(0).max(1000).optional(),
        }).refine((value) => value.operationalCostRate !== undefined || value.profitRate !== undefined, {
            message: "En az bir alan (operationalCostRate/profitRate) gönderilmelidir.",
            path: ["operationalCostRate"],
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productId"],
    }
)

export const listProductVariantSuppliersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productVariantSupplierSchema),
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

const supplierProductSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string(),
    categoryId: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
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
    variantCount: z.number(),
}).loose()

export const listSupplierProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(supplierProductSchema),
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
