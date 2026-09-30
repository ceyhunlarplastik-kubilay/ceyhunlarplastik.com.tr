import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { productionIdParamsSchema, productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — makine başındaki personel (giriş hesabı DEĞİL). Şemada
 * `.default()` yok; varsayılanlar handler'da (bkz. CLAUDE.md).
 */

const operatorBodySchema = z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    employeeNo: z.string().trim().max(30).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
})

export const createProductionOperatorValidator = validatorWrapper(
    z.object({ body: operatorBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["firstName", "lastName"],
    },
)

export const updateProductionOperatorValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: operatorBodySchema.partial(),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductionOperatorValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const productionOperatorResponseSchema = z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    employeeNo: z.string().nullable(),
    phone: z.string().nullable(),
    isActive: z.boolean(),
    notes: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listProductionOperatorsResponseValidator = productionResponse({
    operators: z.array(productionOperatorResponseSchema),
})

export const productionOperatorResponseValidator = productionResponse({
    operator: productionOperatorResponseSchema,
})

export const deleteProductionOperatorResponseValidator = productionResponse({
    id: z.uuid(),
})
