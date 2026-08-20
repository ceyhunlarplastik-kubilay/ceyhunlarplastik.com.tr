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

// Response validators
const productSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    categoryId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const colorSchema = z.object({
    id: z.string(),
    system: z.string(),
    code: z.string(),
    name: z.string(),
    hex: z.string(),
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
    assets: z.array(z.object({
        id: z.string(),
        key: z.string(),
        mimeType: z.string(),
        type: z.string(),
        role: z.string(),
        url: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
    }).loose()).optional(),
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
    price: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    profitRate: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    listPrice: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    pricingUpdatedAt: z.string().nullable().optional(),
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
    createdAt: z.string(),
    updatedAt: z.string(),
})

const measurementSchema = z.object({
    id: z.string(),
    value: z.number(),
    label: z.string(),
    unit: z.string().nullable().optional(),
    measurementType: measurementTypeSchema.nullable(),
}).loose()


export const productVariantSchema = z.object({
    id: z.string(),
    name: z.string(),
    productId: z.string(),
    productSizeId: z.string().optional(),
    productVersionId: z.string().optional(),
    sizeCode: z.number().nullable().optional(),
    versionCode: z.string().nullable().optional(),
    fullCode: z.string(),

    colorId: z.string().nullable().optional(),

    createdAt: z.string(),
    updatedAt: z.string(),

    product: productSchema,
    color: colorSchema,
    materials: z.array(materialSchema),
    // variantSuppliers KASITLI OLARAK YOK: tedarikçi kimliği ve fiyatı public
    // yanıta çıkmaz (bkz. repository.publicInclude).
    measurements: z.array(measurementSchema),
})


export const getProductVariantResponseValidator = z.toJSONSchema(
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
