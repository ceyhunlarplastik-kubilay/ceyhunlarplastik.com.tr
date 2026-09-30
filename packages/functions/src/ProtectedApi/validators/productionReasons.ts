import { z } from "zod"

import { MAX_REASON_NAME_LENGTH, STOP_CATEGORIES } from "@/core/helpers/production/productionReasons"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { productionIdParamsSchema, productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — duruş / fire nedeni sözlüğü. Kod biçimi, tür ↔ kategori kuralı ve kod
 * tekilliği handler'da core `productionReasons.ts` ile (kod büyük harfe normalleşir).
 */

const kindSchema = z.enum(["STOP", "SCRAP"])
const stopCategorySchema = z.enum(STOP_CATEGORIES as [string, ...string[]])

const reasonFields = {
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(MAX_REASON_NAME_LENGTH),
    stopCategory: stopCategorySchema.nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
}

export const createProductionReasonValidator = validatorWrapper(
    z.object({ body: z.object({ kind: kindSchema, ...reasonFields }) }),
    { requiredRootFields: ["body"], requiredBodyFields: ["kind", "code", "name"] },
)

export const updateProductionReasonValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema, body: z.object(reasonFields).partial() }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductionReasonValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

export const productionReasonResponseSchema = z.object({
    id: z.uuid(),
    kind: kindSchema,
    code: z.string(),
    name: z.string(),
    stopCategory: stopCategorySchema.nullable(),
    isActive: z.boolean(),
    sortOrder: z.number(),
    usageCount: z.number(),
}).loose()

export const listProductionReasonsResponseValidator = productionResponse({ reasons: z.array(productionReasonResponseSchema) })
export const productionReasonResponseValidator = productionResponse({ reason: productionReasonResponseSchema })
export const deleteProductionReasonResponseValidator = productionResponse({ id: z.uuid() })
export const createDefaultProductionReasonsResponseValidator = productionResponse({ created: z.number() })
