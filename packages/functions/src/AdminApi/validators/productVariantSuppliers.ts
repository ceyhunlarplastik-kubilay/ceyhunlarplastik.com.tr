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
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const productVariantSupplierSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    supplierId: z.uuid(),
    isActive: z.boolean(),
    price: z.union([z.number(), z.string(), prismaDecimalSchema, z.null()]).optional(),
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
