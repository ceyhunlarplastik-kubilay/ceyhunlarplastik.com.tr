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

// Response Validators
//
// .loose() ZORUNLU: repository variant (-> product -> category) ve supplier
// relation'larını include ediyor; ayrıca modelde netCost, operationalCostRate,
// paymentTermDays, supplierVariantCode, supplierNote, pricingUpdatedAt,
// minOrderQty, stockQty, availabilityUpdatedAt alanları var. Strict bir object
// z.toJSONSchema'da additionalProperties:false üretir ve bu alanları REDDEDER.
//
// Decimal alanları apiResponseDTO'nun normalizeDates'i düz {s,e,d} objesine
// çevirir (Date değil, o yüzden ISO string'e dönüşmez) → prismaDecimalSchema.
const productVariantSupplierSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    supplierId: z.uuid(),
    isActive: z.boolean(),
    price: z.union([z.number(), z.string(), prismaDecimalSchema]),
    profitRate: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    listPrice: z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional(),
    currency: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// getProductVariantSupplier: repository findUnique kullanıyor ve handler null
// kontrolü yapmıyor → kayıt yoksa 200 + { productVariantSupplier: null }.
export const productVariantSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productVariantSupplier: productVariantSupplierSchema.nullable(),
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
