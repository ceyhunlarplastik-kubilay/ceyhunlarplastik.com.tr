import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlamanın dar sözlükleri: ürün modeli → ölçü (kalıp göz grubu), üretilebilir
 * ölçü → varyant (üretim emri), müşteri adı (emir). Query parametresi alan uçlar kendi
 * alanlarını açıkça beyan eder (genel validator her ekstra parametreye 400 verir).
 */

export const listReferenceProductsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({ moldable: z.enum(["true", "false"]).optional() }).optional(),
    }),
    { requiredRootFields: [] },
)

export const searchReferenceCustomersValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({ q: z.string().max(100).optional() }).optional(),
    }),
    { requiredRootFields: [] },
)

export const getReferenceProductSizesValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const referenceProductSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
}).loose()

export const listReferenceProductsResponseValidator = productionResponse({
    products: z.array(referenceProductSchema.extend({ sizeCount: z.number() })),
})

export const referenceProductSizesResponseValidator = productionResponse({
    product: referenceProductSchema,
    sizes: z.array(z.object({
        id: z.uuid(),
        code: z.number(),
        sizeCode: z.string(),
        label: z.string(),
        variantCount: z.number(),
        moldCount: z.number(),
    }).loose()),
})

export const moldSummarySchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
    cavities: z.number(),
}).loose()

export const variantVersionResponseSchema = z.object({
    code: z.string(),
    colorName: z.string().nullable(),
    colorHex: z.string().nullable(),
    materials: z.array(z.string()),
    materialIds: z.array(z.string()),
    signature: z.string(),
}).loose()

export const productSizeRefResponseSchema = z.object({
    id: z.uuid(),
    code: z.number(),
    sizeCode: z.string(),
    label: z.string(),
}).loose()

export const referenceProductVariantsResponseValidator = productionResponse({
    product: referenceProductSchema,
    sizes: z.array(productSizeRefResponseSchema.extend({
        molds: z.array(moldSummarySchema),
        variants: z.array(z.object({
            id: z.uuid(),
            fullCode: z.string(),
            version: variantVersionResponseSchema,
        }).loose()),
    })),
})

export const searchReferenceCustomersResponseValidator = productionResponse({
    customers: z.array(z.object({ id: z.uuid(), name: z.string() }).loose()),
})
