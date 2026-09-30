import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim istatistikleri (Faz 5). Pencere kuralı (sıra, en fazla 3 yıl / makinede 1 yıl) handler'da
 * core `productionStats.ts` ile; burada yalnız biçim. Kabul edilen sorgu alanları AÇIKÇA beyan edilir.
 */

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const getProductHistoryValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            productId: z.uuid(),
            sizeId: z.uuid().optional(),
            version: z.string().min(1).max(500).optional(),
            from: dateKeySchema.optional(),
            to: dateKeySchema.optional(),
        }),
    }),
    { requiredRootFields: ["queryStringParameters"], requiredQueryStringParametersFields: ["productId"] },
)

const jobStatusSchema = z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])

export const productHistoryResponseValidator = productionResponse({
    product: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
    range: z.object({ from: z.string(), to: z.string() }).loose(),
    sizes: z.array(z.object({ id: z.uuid(), sizeCode: z.string(), label: z.string() }).loose()),
    versions: z.array(z.object({
        signature: z.string(),
        code: z.string(),
        colorName: z.string().nullable(),
        colorHex: z.string().nullable(),
        materials: z.array(z.string()),
    }).loose()),
    rows: z.array(z.object({
        jobId: z.uuid(),
        jobOutputId: z.uuid(),
        lotBaseNumber: z.number(),
        jobStatus: jobStatusSchema,
        finalCount: z.boolean(),
        machineCode: z.string(),
        moldCode: z.string(),
        cavities: z.number(),
        size: z.object({ id: z.uuid(), sizeCode: z.string(), label: z.string() }).loose(),
        version: z.object({
            code: z.string(),
            colorName: z.string().nullable(),
            colorHex: z.string().nullable(),
            materials: z.array(z.string()),
        }).loose().nullable(),
        order: z.object({ orderNumber: z.string(), variantCode: z.string() }).loose().nullable(),
        plannedStartAt: z.string(),
        plannedEndAt: z.string(),
        startedAt: z.string().nullable(),
        endedAt: z.string().nullable(),
        lotCount: z.number(),
        reportedLotCount: z.number(),
        plannedQuantity: z.number(),
        goodQuantity: z.number(),
        scrapQuantity: z.number(),
        scrapRate: z.number().nullable(),
        plannedCycleSec: z.number(),
        actualCycleSec: z.number().nullable(),
        plannedMinutes: z.number(),
        grossMinutes: z.number(),
        runMinutes: z.number(),
    }).loose()),
    summary: z.object({
        jobCount: z.number(),
        rowCount: z.number(),
        plannedQuantity: z.number(),
        goodQuantity: z.number(),
        scrapQuantity: z.number(),
        scrapRate: z.number().nullable(),
        reportedLotCount: z.number(),
        plannedCycleSec: z.number().nullable(),
        actualCycleSec: z.number().nullable(),
        truncated: z.boolean(),
    }).loose(),
})

export const getMachineStatsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            from: dateKeySchema.optional(),
            to: dateKeySchema.optional(),
            areaId: z.uuid().optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

const minutesSchema = z.number()
const stopMinutesSchema = z.object({
    PLANNED: minutesSchema,
    BREAKDOWN: minutesSchema,
    MATERIAL: minutesSchema,
    QUALITY: minutesSchema,
    PERSONNEL: minutesSchema,
    OTHER: minutesSchema,
}).loose()
const machineStatsTotalsShape = {
    time: z.object({
        capacityMinutes: minutesSchema,
        productionMinutes: minutesSchema,
        overtimeMinutes: minutesSchema,
        runMinutes: minutesSchema,
        stopMinutes: stopMinutesSchema,
        downtimeMinutes: z.object({ PLANNED_MAINTENANCE: minutesSchema, BREAKDOWN: minutesSchema, OTHER: minutesSchema }).loose(),
        idleMinutes: minutesSchema,
    }).loose(),
    report: z.object({
        reportedLotCount: z.number(),
        unreportedLotCount: z.number(),
        grossMinutes: minutesSchema,
        stopMinutes: stopMinutesSchema,
        runMinutes: minutesSchema,
        shots: z.number(),
        idealMinutes: minutesSchema,
        goodQuantity: z.number(),
        scrapQuantity: z.number(),
    }).loose(),
    utilization: z.number().nullable(),
    availability: z.number().nullable(),
    performance: z.number().nullable(),
    quality: z.number().nullable(),
    oee: z.number().nullable(),
}

export const machineStatsResponseValidator = productionResponse({
    range: z.object({ from: z.string(), to: z.string(), startAt: z.string(), endAt: z.string() }).loose(),
    generatedAt: z.string(),
    areaId: z.uuid().nullable(),
    areas: z.array(z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose()),
    rows: z.array(z.object({
        machineId: z.uuid(),
        code: z.string(),
        name: z.string(),
        areaCode: z.string(),
        ...machineStatsTotalsShape,
    }).loose()),
    totals: z.object(machineStatsTotalsShape).loose(),
    stopReasons: z.array(z.object({
        reasonId: z.uuid(),
        code: z.string(),
        name: z.string(),
        category: z.enum(["PLANNED", "BREAKDOWN", "MATERIAL", "QUALITY", "PERSONNEL", "OTHER"]),
        minutes: minutesSchema,
        count: z.number(),
    }).loose()),
})

export const getMoldStatsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            from: dateKeySchema.optional(),
            to: dateKeySchema.optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

const cycleTotalsShape = {
    reportedLotCount: z.number(),
    shots: z.number(),
    runMinutes: z.number(),
    goodQuantity: z.number(),
    scrapQuantity: z.number(),
    actualCycleSec: z.number().nullable(),
    plannedCycleSec: z.number().nullable(),
    deviation: z.number().nullable(),
}

const maintenanceLevelSchema = z.enum(["NONE", "OK", "SOON", "DUE"])

export const moldStatsResponseValidator = productionResponse({
    range: z.object({ from: z.string(), to: z.string() }).loose(),
    generatedAt: z.string(),
    rows: z.array(z.object({
        moldId: z.uuid(),
        code: z.string(),
        name: z.string(),
        status: z.enum(["ACTIVE", "IN_MAINTENANCE", "BROKEN", "RETIRED"]),
        standardCycleTimeSec: z.number(),
        totalShots: z.number(),
        lastMaintenanceAt: z.string().nullable(),
        maintenance: z.object({
            level: maintenanceLevelSchema,
            projectedLevel: maintenanceLevelSchema,
            shotsSinceMaintenance: z.number(),
            intervalShots: z.number().nullable(),
            remainingShots: z.number().nullable(),
            ratio: z.number().nullable(),
        }).loose(),
        shotsAhead: z.number(),
        scrapRate: z.number().nullable(),
        ...cycleTotalsShape,
        machines: z.array(z.object({
            machineId: z.uuid(),
            machineCode: z.string(),
            hasCard: z.boolean(),
            cardCycleSec: z.number().nullable(),
            ...cycleTotalsShape,
            suggestion: z.object({
                cycleTimeSec: z.number(),
                referenceSec: z.number(),
                referenceSource: z.enum(["card", "plan"]),
                deviation: z.number(),
            }).loose().nullable(),
        }).loose()),
        versions: z.array(z.object({
            versionSignature: z.string(),
            colorName: z.string().nullable(),
            colorHex: z.string().nullable(),
            materials: z.array(z.string()),
            ...cycleTotalsShape,
        }).loose()),
        suggestionCount: z.number(),
    }).loose()),
    summary: z.object({
        moldCount: z.number(),
        usedMoldCount: z.number(),
        reportedLotCount: z.number(),
        shots: z.number(),
        goodQuantity: z.number(),
        scrapQuantity: z.number(),
        scrapRate: z.number().nullable(),
        maintenanceAlertCount: z.number(),
        suggestionCount: z.number(),
    }).loose(),
})
