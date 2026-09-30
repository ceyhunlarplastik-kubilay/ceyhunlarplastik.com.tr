import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/** Üretim planlama — hammaddenin üretim profili (katalog `Material`'ın 1:1 yan tablosu). */

const materialProfileBodySchema = z.object({
    isMoldResin: z.boolean(),
    family: z.string().trim().max(40).nullable().optional(),
    densityGCm3: z.number().positive().max(30).nullable().optional(),
    requiresDrying: z.boolean(),
    dryingTempC: z.number().int().min(0).max(400).nullable().optional(),
    dryingHours: z.number().min(0).max(72).nullable().optional(),
    cycleTimeFactor: z.number().min(0.1).max(10),
    purgeNote: z.string().trim().max(1000).nullable().optional(),
})

export const upsertMaterialProfileValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ materialId: z.uuid() }),
        body: materialProfileBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["isMoldResin", "requiresDrying", "cycleTimeFactor"],
    },
)

// ---- Response ----

const materialWithProfileSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    code: z.string().nullable(),
    profile: z.object({
        isMoldResin: z.boolean(),
        family: z.string().nullable(),
        densityGCm3: z.number().nullable(),
        requiresDrying: z.boolean(),
        dryingTempC: z.number().nullable(),
        dryingHours: z.number().nullable(),
        cycleTimeFactor: z.number(),
        purgeNote: z.string().nullable(),
        updatedAt: z.string(),
    }).loose().nullable(),
}).loose()

export const listMaterialProfilesResponseValidator = productionResponse({
    materials: z.array(materialWithProfileSchema),
})

export const materialProfileResponseValidator = productionResponse({
    material: materialWithProfileSchema,
})
