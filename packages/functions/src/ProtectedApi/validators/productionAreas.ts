import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionResponse,
    shiftPatternRefSchema,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — parkur / alan. Şemada `.default()` yok (ajv union altındaki
 * default'u uygulayamıyor, bkz. CLAUDE.md); varsayılanlar handler'da uygulanır.
 */

const areaBodySchema = z.object({
    code: z.string().trim().min(1).max(20),
    name: z.string().trim().min(1).max(120),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    shiftPatternId: z.uuid().nullable().optional(),
})

export const createProductionAreaValidator = validatorWrapper(
    z.object({ body: areaBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    },
)

export const updateProductionAreaValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: areaBodySchema.partial(),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductionAreaValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const productionAreaResponseSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    sortOrder: z.number(),
    isActive: z.boolean(),
    notes: z.string().nullable(),
    shiftPatternId: z.uuid().nullable(),
    shiftPattern: shiftPatternRefSchema.nullable(),
    machineCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listProductionAreasResponseValidator = productionResponse({
    areas: z.array(productionAreaResponseSchema),
})

export const productionAreaResponseValidator = productionResponse({
    area: productionAreaResponseSchema,
})

export const deleteProductionAreaResponseValidator = productionResponse({
    id: z.uuid(),
})
