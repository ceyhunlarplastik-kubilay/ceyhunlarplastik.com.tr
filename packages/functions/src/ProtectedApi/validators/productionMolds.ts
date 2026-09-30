import { z } from "zod"

import { MAX_CARD_CYCLE_SEC } from "@/core/helpers/production/moldStats"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionMachineRefSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — kalıp. Göz grupları (`outputs`) ve kalıp-makine kartları
 * (`machineProfiles`) aynı istekte gelir; gönderilirse TAM değişimdir. Tekrarlanan ölçü
 * / makine, tercih + engel çelişkisi gibi kurallar handler'da core `molds.ts` ile.
 */

const moldStatusSchema = z.enum(["ACTIVE", "IN_MAINTENANCE", "BROKEN", "RETIRED"])
const moldOwnershipSchema = z.enum(["COMPANY", "CUSTOMER"])

const optionalMillimetersSchema = z.number().int().min(1).max(20000).nullable().optional()
const shotCountSchema = z.number().int().min(0).max(2_000_000_000)

const moldOutputSchema = z.object({
    productSizeId: z.uuid(),
    cavities: z.number().int().min(1).max(256),
    partWeightG: z.number().positive().max(100_000).nullable().optional(),
})

const moldMachineProfileSchema = z.object({
    machineId: z.uuid(),
    cycleTimeSec: z.number().positive().max(MAX_CARD_CYCLE_SEC).nullable().optional(),
    setupMinutes: z.number().int().min(0).max(10_000).nullable().optional(),
    isPreferred: z.boolean().optional(),
    isBlocked: z.boolean().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
})

const moldBodySchema = z.object({
    code: z.string().trim().min(1).max(30),
    name: z.string().trim().min(1).max(160),
    status: moldStatusSchema.optional(),
    ownership: moldOwnershipSchema.optional(),
    requiredClampForceTon: z.number().int().min(1).max(10_000).nullable().optional(),
    widthMm: optionalMillimetersSchema,
    heightMm: optionalMillimetersSchema,
    thicknessMm: optionalMillimetersSchema,
    weightKg: z.number().positive().max(100_000).nullable().optional(),
    requiredOpeningStrokeMm: optionalMillimetersSchema,
    locatingRingDiameterMm: z.number().int().min(1).max(1000).nullable().optional(),
    hotRunnerZones: z.number().int().min(0).max(200).optional(),
    coreCircuitsRequired: z.number().int().min(0).max(50).optional(),
    requiresRobot: z.boolean().optional(),
    standardCycleTimeSec: z.number().positive().max(3600),
    runnerWeightG: z.number().min(0).max(100_000).nullable().optional(),
    expectedScrapPercent: z.number().min(0).max(100).optional(),
    setupMinutes: z.number().int().min(0).max(10_000).optional(),
    totalShots: shotCountSchema.optional(),
    maintenanceIntervalShots: z.number().int().min(1).max(2_000_000_000).nullable().optional(),
    shotsAtLastMaintenance: shotCountSchema.optional(),
    lastMaintenanceAt: z.iso.datetime().nullable().optional(),
    storageLocation: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    outputs: z.array(moldOutputSchema).max(20).optional(),
    machineProfiles: z.array(moldMachineProfileSchema).max(100).optional(),
})

export const getMoldValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

export const createMoldValidator = validatorWrapper(
    z.object({ body: moldBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "standardCycleTimeSec"],
    },
)

export const updateMoldValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: moldBodySchema.partial(),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteMoldValidator = getMoldValidator

// ---- Response ----

const moldResponseSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: moldStatusSchema,
    ownership: moldOwnershipSchema,
    ownerCustomerId: z.uuid().nullable(),
    requiredClampForceTon: z.number().nullable(),
    widthMm: z.number().nullable(),
    heightMm: z.number().nullable(),
    thicknessMm: z.number().nullable(),
    weightKg: z.number().nullable(),
    requiredOpeningStrokeMm: z.number().nullable(),
    locatingRingDiameterMm: z.number().nullable(),
    hotRunnerZones: z.number(),
    coreCircuitsRequired: z.number(),
    requiresRobot: z.boolean(),
    standardCycleTimeSec: z.number(),
    runnerWeightG: z.number().nullable(),
    expectedScrapPercent: z.number(),
    setupMinutes: z.number(),
    totalShots: z.number(),
    maintenanceIntervalShots: z.number().nullable(),
    shotsAtLastMaintenance: z.number(),
    lastMaintenanceAt: z.string().nullable(),
    storageLocation: z.string().nullable(),
    notes: z.string().nullable(),
    outputs: z.array(z.object({
        id: z.uuid(),
        productSizeId: z.uuid(),
        cavities: z.number(),
        partWeightG: z.number().nullable(),
        product: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
        size: z.object({ id: z.uuid(), code: z.number(), sizeCode: z.string(), label: z.string() }).loose(),
    }).loose()),
    machineProfiles: z.array(z.object({
        id: z.uuid(),
        machineId: z.uuid(),
        cycleTimeSec: z.number().nullable(),
        setupMinutes: z.number().nullable(),
        isPreferred: z.boolean(),
        isBlocked: z.boolean(),
        notes: z.string().nullable(),
        machine: productionMachineRefSchema,
    }).loose()),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listMoldsResponseValidator = productionResponse({ molds: z.array(moldResponseSchema) })

export const moldResponseValidator = productionResponse({ mold: moldResponseSchema })

export const deleteMoldResponseValidator = productionResponse({ id: z.uuid() })

export const recordMoldMaintenanceValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema, body: z.object({ performedAt: z.iso.datetime().optional() }) }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const setMoldMachineCycleValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid(), machineId: z.uuid() }),
        body: z.object({ cycleTimeSec: z.number().positive().max(MAX_CARD_CYCLE_SEC) }),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const setMoldMachineCycleResponseValidator = productionResponse({
    moldId: z.uuid(),
    machineId: z.uuid(),
    cycleTimeSec: z.number(),
    created: z.boolean(),
})
