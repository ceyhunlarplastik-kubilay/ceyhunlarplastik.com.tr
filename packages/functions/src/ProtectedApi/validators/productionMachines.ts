import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionAreaRefSchema,
    productionIdParamsSchema,
    productionResponse,
    shiftPatternRefSchema,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — enjeksiyon makinesi. Teknik değerler opsiyonel: boş bırakılan
 * alan uygunluk kontrolünde "doğrulanamadı" uyarısı üretir, kaydı engellemez.
 * min ≤ maks gibi çapraz kurallar handler'da (core `findMachineSpecIssues`).
 */

const machineStatusSchema = z.enum(["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"])

const optionalMillimetersSchema = z.number().int().min(1).max(20000).nullable().optional()

const machineBodySchema = z.object({
    code: z.string().trim().min(1).max(20),
    name: z.string().trim().min(1).max(120),
    brand: z.string().trim().max(80).nullable().optional(),
    model: z.string().trim().max(80).nullable().optional(),
    serialNumber: z.string().trim().max(80).nullable().optional(),
    manufactureYear: z.number().int().min(1950).max(2100).nullable().optional(),
    areaId: z.uuid(),
    status: machineStatusSchema.optional(),
    clampForceTon: z.number().int().min(1).max(10000),
    tieBarHorizontalMm: optionalMillimetersSchema,
    tieBarVerticalMm: optionalMillimetersSchema,
    minMoldHeightMm: optionalMillimetersSchema,
    maxMoldHeightMm: optionalMillimetersSchema,
    maxOpeningStrokeMm: optionalMillimetersSchema,
    maxDaylightMm: optionalMillimetersSchema,
    shotCapacityG: z.number().positive().max(1_000_000).nullable().optional(),
    screwDiameterMm: z.number().int().min(1).max(1000).nullable().optional(),
    locatingRingDiameterMm: z.number().int().min(1).max(1000).nullable().optional(),
    hotRunnerZones: z.number().int().min(0).max(200).optional(),
    coreCircuits: z.number().int().min(0).max(50).optional(),
    hasRobot: z.boolean().optional(),
    plannedEfficiencyPercent: z.number().int().min(1).max(100).optional(),
    hourlyCost: z.number().min(0).max(10_000_000).nullable().optional(),
    shiftPatternId: z.uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
})

export const getProductionMachineValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

export const createProductionMachineValidator = validatorWrapper(
    z.object({ body: machineBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "areaId", "clampForceTon"],
    },
)

export const updateProductionMachineValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: machineBodySchema.partial(),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductionMachineValidator = getProductionMachineValidator

// ---- Response ----

const productionMachineResponseSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    brand: z.string().nullable(),
    model: z.string().nullable(),
    serialNumber: z.string().nullable(),
    manufactureYear: z.number().nullable(),
    areaId: z.uuid(),
    area: productionAreaRefSchema,
    status: machineStatusSchema,
    clampForceTon: z.number(),
    tieBarHorizontalMm: z.number().nullable(),
    tieBarVerticalMm: z.number().nullable(),
    minMoldHeightMm: z.number().nullable(),
    maxMoldHeightMm: z.number().nullable(),
    maxOpeningStrokeMm: z.number().nullable(),
    maxDaylightMm: z.number().nullable(),
    shotCapacityG: z.number().nullable(),
    screwDiameterMm: z.number().nullable(),
    locatingRingDiameterMm: z.number().nullable(),
    hotRunnerZones: z.number(),
    coreCircuits: z.number(),
    hasRobot: z.boolean(),
    plannedEfficiencyPercent: z.number(),
    // Repository Decimal'i number'a çeviriyor (bkz. ProductionMachineDto).
    hourlyCost: z.number().nullable(),
    currency: z.string(),
    shiftPatternId: z.uuid().nullable(),
    shiftPattern: shiftPatternRefSchema.nullable(),
    sortOrder: z.number(),
    notes: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listProductionMachinesResponseValidator = productionResponse({
    machines: z.array(productionMachineResponseSchema),
})

export const productionMachineResponseValidator = productionResponse({
    machine: productionMachineResponseSchema,
})

export const deleteProductionMachineResponseValidator = productionResponse({
    id: z.uuid(),
})
