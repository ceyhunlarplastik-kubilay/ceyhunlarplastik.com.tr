import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const productSchema = z.object({
    id: z.string(),
    code: z.string(),
    slug: z.string(),
    name: z.string(),
    categoryId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

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
    code: z.string().nullable(),
    isActive: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const supplierSchema = z.object({
    id: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const variantSupplierSchema = z.object({
    id: z.string(),
    variantId: z.string(),
    supplierId: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    supplier: supplierSchema,
})

const measurementTypeSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    baseUnit: z.string(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const measurementSchema = z.object({
    id: z.string(),
    variantId: z.string(),
    measurementTypeId: z.string(),
    value: z.number(),
    label: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    measurementType: measurementTypeSchema,
})


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
})


const createVariantSupplierInputSchema = z.object({
    id: z.uuid(), // supplier id
    isActive: z.boolean().optional(),
})

export const createProductVariantValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            variantIndex: z.number().int().min(1),
            suppliers: z.array(createVariantSupplierInputSchema).optional(),
            versionCode: z.string().min(1),
            supplierCode: z.string().min(1),
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
            productId: z.uuid().optional(),
            variantIndex: z.number().int().min(1).optional(),
            suppliers: z.array(createVariantSupplierInputSchema).optional(),
            versionCode: z.string().min(1).optional(),
            supplierCode: z.string().min(1).optional(),
            name: z.string().min(1).optional(),
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
