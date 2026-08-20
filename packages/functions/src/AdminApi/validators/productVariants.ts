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
}).loose().nullable()

const materialSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().nullable().optional(),
    assets: z.array(z.object({
        id: z.string(),
        key: z.string(),
        mimeType: z.string(),
        type: z.string(),
        role: z.string(),
        url: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
    }).loose()).optional(),
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
    supplierCode: z.string().nullable().optional(),
    fullCode: z.string().nullable().optional(),
    hasSupplierLogo: z.boolean().optional(),
    unitsPerPackage: z.number().nullable().optional(),
    packageLengthMm: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    packageWidthMm: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    packageHeightMm: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    packageWeightKg: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    minLeadTimeDays: z.number().nullable().optional(),
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

// Yanıt DTO'su düzleştirilmiş yapıyı taşır (bkz. flattenVariantStructure.ts):
// ölçüler `size.values`'tan, renk/hammadde `version`'dan düzleştirilir.
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

    product: productSchema.optional(),
    color: colorSchema.optional(),
    materials: z.array(materialSchema).optional(),
    variantSuppliers: z.array(variantSupplierSchema).optional(),
    measurements: z.array(measurementSchema).optional(),
}).loose()


const variantSupplierInputSchema = z.object({
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
    hasSupplierLogo: z.boolean().optional(),
    unitsPerPackage: z.number().int().min(0).optional(),
    packageLengthMm: z.number().nonnegative().optional(),
    packageWidthMm: z.number().nonnegative().optional(),
    packageHeightMm: z.number().nonnegative().optional(),
    packageWeightKg: z.number().nonnegative().optional(),
    minLeadTimeDays: z.number().int().min(0).optional(),
})

/**
 * DİKKAT: kod alanları (versionCode/supplierCode/variantIndex) şemadan KALDIRILDI.
 * Kodlar sunucuda ölçü/versiyon/tedarikçi sözlüklerinden türetilir; istemcinin
 * gönderdiği bir kod artık kabul edilmez.
 */
export const createProductVariantValidator = validatorWrapper(
    z.object({
        body: z.object({
            productId: z.uuid(),
            name: z.string().min(1),
            colorId: z.uuid().optional(),
            materialIds: z.array(z.uuid()).optional(),
            measurements: z.array(z.object({
                requirementId: z.uuid(),
                value: z.number(),
            })).min(1),
            supplier: variantSupplierInputSchema.optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productId", "name", "measurements"],
    }
)

/**
 * Yalnız ad güncellenir — ölçü/versiyon/tedarikçi varyantın kimliğini belirlediği
 * için değişimi matris akışına aittir (bkz. updateProductVariantHandler).
 */
export const updateProductVariantValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(1),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["name"],
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
