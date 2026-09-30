import { z } from "zod"

import { MAX_CARD_CYCLE_SEC } from "@/core/helpers/production/moldStats"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productSizeRefResponseSchema,
    variantVersionResponseSchema,
} from "@/functions/ProtectedApi/validators/productionReferences"
import { productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/** Üretim planlama — iç üretim varyantları ve varyanta özel çevrim (katalog `ProductVariant`'ın 1:1 yan tablosu). */

export const listProductionVariantsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().regex(/^\d{1,6}$/).optional(),
            limit: z.string().regex(/^\d{1,3}$/).optional(),
            q: z.string().max(100).optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const upsertProductionVariantProfileValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ variantId: z.uuid() }),
        body: z.object({
            cycleTimeSec: z.number().min(0.1).max(MAX_CARD_CYCLE_SEC).nullable(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["cycleTimeSec"],
    },
)

// ---- Response ----

const productionVariantSchema = z.object({
    id: z.uuid(),
    fullCode: z.string(),
    product: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
    size: productSizeRefResponseSchema,
    version: variantVersionResponseSchema,
    usableMoldCount: z.number(),
    cycleTimeSec: z.number().nullable(),
    profileUpdatedAt: z.string().nullable(),
}).loose()

export const listProductionVariantsResponseValidator = productionResponse({
    data: z.array(productionVariantSchema),
    meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }).loose(),
})

export const productionVariantResponseValidator = productionResponse({
    variant: productionVariantSchema,
})
