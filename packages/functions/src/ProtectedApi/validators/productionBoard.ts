import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { productionAreaRefSchema, productionMachineRefSchema, productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — tahta (salt okunur). Pencere sınırı (en fazla 31 gün, sıra) handler'da
 * core `productionBoard.ts` ile; burada yalnız biçim.
 */

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const getProductionBoardValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            from: dateKeySchema.optional(),
            to: dateKeySchema.optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

const jobStatusSchema = z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])

export const productionBoardResponseValidator = productionResponse({
    range: z.object({ from: z.string(), to: z.string(), startAt: z.string(), endAt: z.string() }).loose(),
    generatedAt: z.string(),
    machines: z.array(z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        status: z.enum(["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"]),
        area: productionAreaRefSchema,
        shiftPatternName: z.string().nullable(),
        shifts: z.array(z.object({
            workday: z.string(),
            shiftCode: z.string(),
            shiftName: z.string(),
            startAt: z.string(),
            endAt: z.string(),
        }).loose()),
        dayExceptions: z.array(z.object({
            date: z.string(),
            kind: z.enum(["HOLIDAY", "SHUTDOWN", "EXTRA_WORKDAY"]),
        }).loose()),
    }).loose()),
    downtimes: z.array(z.object({
        id: z.uuid(),
        machineId: z.uuid(),
        startAt: z.string(),
        endAt: z.string(),
        kind: z.enum(["PLANNED_MAINTENANCE", "BREAKDOWN", "OTHER"]),
        reason: z.string().nullable(),
    }).loose()),
    pendingOrders: z.array(z.object({
        id: z.uuid(),
        orderNumber: z.number(),
        status: z.string(),
        variantCode: z.string(),
        productName: z.string(),
        sizeLabel: z.string(),
        quantity: z.number(),
        dueDate: z.string().nullable(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
        colorHex: z.string().nullable(),
        colorName: z.string().nullable(),
        machineFit: z.array(z.object({
            machineId: z.uuid(),
            verdict: z.enum(["ok", "warning", "unknown", "error"]),
        }).loose()),
    }).loose()),
    pendingOrderTotal: z.number(),
    jobs: z.array(z.object({
        id: z.uuid(),
        lotBaseNumber: z.number(),
        status: jobStatusSchema,
        machineId: z.uuid(),
        mold: productionMachineRefSchema.extend({
            totalShots: z.number(),
            maintenanceIntervalShots: z.number().nullable(),
            shotsAtLastMaintenance: z.number(),
        }),
        setupStartAt: z.string(),
        productionStartAt: z.string(),
        plannedEndAt: z.string(),
        plannedShots: z.number(),
        cycleTimeSec: z.number(),
        efficiencyPercent: z.number(),
        setupMinutes: z.number(),
        /** Planlanan ↔ gerçekleşen (4.3). */
        forecast: z.object({
            state: z.enum(["DONE", "PRODUCED", "ON_TRACK", "NOT_STARTED", "BEHIND", "OVERDUE"]),
            progress: z.number(),
            reportedShots: z.number(),
            remainingShots: z.number(),
            projectedEndAt: z.string().nullable(),
            delayMinutes: z.number().nullable(),
            dueRisk: z.boolean(),
        }).loose(),
        moldMaintenance: z.object({
            level: z.enum(["NONE", "OK", "SOON", "DUE"]),
            projectedLevel: z.enum(["NONE", "OK", "SOON", "DUE"]),
            shotsSinceMaintenance: z.number(),
            intervalShots: z.number().nullable(),
            remainingShots: z.number().nullable(),
            ratio: z.number().nullable(),
        }).loose(),
        version: z.number(),
        colorHex: z.string().nullable(),
        colorName: z.string().nullable(),
        machineFit: z.array(z.object({
            machineId: z.uuid(),
            verdict: z.enum(["ok", "warning", "unknown", "error"]),
            reason: z.string().nullable(),
        }).loose()),
        outputs: z.array(z.object({
            productSizeId: z.string(),
            cavities: z.number(),
            plannedQuantity: z.number(),
            order: z.object({
                id: z.uuid(),
                orderNumber: z.string(),
                variantCode: z.string(),
                quantity: z.number(),
                dueDate: z.string().nullable(),
            }).loose().nullable(),
        }).loose()),
        lots: z.array(z.object({
            lotNumber: z.string(),
            sequence: z.number(),
            shiftDate: z.string(),
            shiftCode: z.string(),
            plannedStartAt: z.string(),
            plannedEndAt: z.string(),
            plannedShots: z.number(),
            status: z.enum(["PLANNED", "RUNNING", "COMPLETED", "CANCELLED"]),
            actualStartAt: z.string().nullable(),
            actualEndAt: z.string().nullable(),
            actualShots: z.number().nullable(),
            reported: z.boolean(),
        }).loose()),
    }).loose()),
})
