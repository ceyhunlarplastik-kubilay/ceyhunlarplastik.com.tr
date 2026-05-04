import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const prismaDecimalSchema = z.object({
    s: z.number(),
    e: z.number(),
    d: z.array(z.number()),
}).loose()

const productSchema = z.object({
    id: z.string(),
    code: z.string(),
    slug: z.string().optional(),
    name: z.string(),
    categoryId: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose()

const colorSchema = z.object({
    id: z.string(),
    system: z.string().optional(),
    code: z.string(),
    name: z.string(),
    hexCode: z.string().optional(),
    hex: z.string().optional(),
    rgbR: z.number().nullable(),
    rgbG: z.number().nullable(),
    rgbB: z.number().nullable(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).nullable()

const materialSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose()

const supplierSchema = z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose()

const variantSupplierSchema = z.object({
    id: z.string(),
    variantId: z.string(),
    supplierId: z.string(),
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
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    supplier: supplierSchema,
}).loose()

const measurementTypeSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    baseUnit: z.string(),
    displayOrder: z.number(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose()

const measurementSchema = z.object({
    id: z.string(),
    variantId: z.string(),
    measurementTypeId: z.string(),
    value: z.number(),
    label: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    measurementType: measurementTypeSchema,
}).loose()


export const productVariantSchema = z.object({
    id: z.string(),
    name: z.string(),
    productId: z.string(),
    versionCode: z.string(),
    supplierCode: z.string(),
    variantIndex: z.number(),
    fullCode: z.string(),

    colorId: z.string().nullable(),

    createdAt: z.string(),
    updatedAt: z.string(),

    product: productSchema,
    color: colorSchema,
    materials: z.array(materialSchema),
    variantSuppliers: z.array(variantSupplierSchema),
    measurements: z.array(measurementSchema),
}).loose()


const createVariantSupplierInputSchema = z.object({
    id: z.uuid(), // supplier id
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
})

export const createProductVariantValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            variantIndex: z.number().int().min(1),
            suppliers: z.array(createVariantSupplierInputSchema).optional(),
            versionCode: z.string().regex(/^V[0-9]+$/),
            supplierCode: z.string().regex(/^[A-Z]$/),
            name: z.string().min(1),
            colorId: z.uuid().optional(),
            materialIds: z.array(z.uuid()).optional(),
            measurements: z.array(z.object({
                measurementTypeId: z.uuid(),
                value: z.number(),
                label: z.string().optional(),
            })).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productId", "variantIndex", "versionCode", "supplierCode", "name"],
    }
)

export const updateProductVariantValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            productId: z.string().optional(),
            variantIndex: z.coerce.number().int().min(1).optional(),
            suppliers: z.array(
                z.object({
                    id: z.string().min(1),
                    isActive: z.boolean().optional(),
                    price: z.union([z.number(), z.coerce.number()]).optional(),
                    operationalCostRate: z.union([z.number(), z.coerce.number()]).optional(),
                    netCost: z.union([z.number(), z.coerce.number()]).optional(),
                    profitRate: z.union([z.number(), z.coerce.number()]).optional(),
                    listPrice: z.union([z.number(), z.coerce.number()]).optional(),
                    paymentTermDays: z.union([z.number().int(), z.coerce.number().int()]).optional(),
                    supplierVariantCode: z.string().max(120).optional(),
                    supplierNote: z.string().max(2000).optional(),
                    minOrderQty: z.union([z.number().int(), z.coerce.number().int()]).optional(),
                    stockQty: z.union([z.number().int(), z.coerce.number().int()]).optional(),
                    currency: z.string().min(3).max(3).optional(),
                }).loose()
            ).optional(),
            versionCode: z.string().regex(/^V[0-9]+$/).optional(),
            supplierCode: z.string().regex(/^[A-Z]$/).optional(),
            name: z.string().min(1).optional(),
            colorId: z.string().optional(),
            materialIds: z.array(z.string()).optional(),
            measurements: z.array(z.object({
                measurementTypeId: z.string().min(1),
                value: z.union([z.number(), z.coerce.number()]),
                label: z.string().optional(),
            }).loose()).optional(),
        }).loose(),
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

export const productVariantResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productVariant: productVariantSchema,
            })
        })
    }).loose()
)

export const listProductVariantResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productVariantSchema),
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
