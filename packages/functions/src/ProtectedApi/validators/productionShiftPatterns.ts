import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — vardiya düzeni. Buradaki sınırlar yalnız biçimdir; örtüşme,
 * 24 saati aşma ve tekrarlanan kod gibi düzen kuralları handler'da core
 * `findShiftPatternIssues` ile denetlenir (istek şemasında `.refine()` sessizce düşer).
 */

const shiftSchema = z.object({
    code: z.string().trim().min(1).max(8),
    name: z.string().trim().min(1).max(40),
    startMinute: z.number().int().min(0).max(1439),
    durationMinutes: z.number().int().min(30).max(1440),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1).max(7),
})

const shiftPatternBodySchema = z.object({
    name: z.string().trim().min(1).max(80),
    isDefault: z.boolean().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    shifts: z.array(shiftSchema).min(1).max(4),
})

export const createShiftPatternValidator = validatorWrapper(
    z.object({ body: shiftPatternBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name", "shifts"],
    },
)

/** Tam değişim (PUT): vardiya listesi her zaman eksiksiz gönderilir. */
export const replaceShiftPatternValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: shiftPatternBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["name", "shifts"],
    },
)

export const deleteShiftPatternValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const shiftResponseSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    startMinute: z.number(),
    durationMinutes: z.number(),
    daysOfWeek: z.array(z.number()),
    sortOrder: z.number(),
}).loose()

const shiftPatternResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    isDefault: z.boolean(),
    timezone: z.string(),
    notes: z.string().nullable(),
    shifts: z.array(shiftResponseSchema),
    machineCount: z.number(),
    areaCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listShiftPatternsResponseValidator = productionResponse({
    shiftPatterns: z.array(shiftPatternResponseSchema),
})

export const shiftPatternResponseValidator = productionResponse({
    shiftPattern: shiftPatternResponseSchema,
})

export const deleteShiftPatternResponseValidator = productionResponse({
    id: z.uuid(),
})
