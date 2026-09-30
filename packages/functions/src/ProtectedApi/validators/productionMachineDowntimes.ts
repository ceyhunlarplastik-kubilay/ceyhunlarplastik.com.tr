import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionMachineRefSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — makine duruşları (planlı bakım, arıza…). Zamanlar ISO 8601 UTC.
 * Başlangıç < bitiş, azami süre ve aynı makinede çakışma kuralları handler'da (core
 * `findMachineDowntimeIssues` + repository çakışma sorgusu).
 */

const machineDowntimeKindSchema = z.enum(["PLANNED_MAINTENANCE", "BREAKDOWN", "OTHER"])

const machineDowntimeBodySchema = z.object({
    machineId: z.uuid(),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
    kind: machineDowntimeKindSchema,
    reason: z.string().trim().max(2000).nullable().optional(),
})

export const listMachineDowntimesValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            machineId: z.uuid().optional(),
            from: z.iso.datetime().optional(),
            to: z.iso.datetime().optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const createMachineDowntimeValidator = validatorWrapper(
    z.object({ body: machineDowntimeBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["machineId", "startAt", "endAt", "kind"],
    },
)

export const updateMachineDowntimeValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: machineDowntimeBodySchema.partial(),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteMachineDowntimeValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const machineDowntimeResponseSchema = z.object({
    id: z.uuid(),
    machineId: z.uuid(),
    machine: productionMachineRefSchema,
    startAt: z.string(),
    endAt: z.string(),
    kind: machineDowntimeKindSchema,
    reason: z.string().nullable(),
    createdByUserId: z.uuid().nullable(),
    createdByUser: z.object({
        id: z.uuid(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
    }).loose().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listMachineDowntimesResponseValidator = productionResponse({
    downtimes: z.array(machineDowntimeResponseSchema),
})

export const machineDowntimeResponseValidator = productionResponse({
    downtime: machineDowntimeResponseSchema,
})

export const deleteMachineDowntimeResponseValidator = productionResponse({
    id: z.uuid(),
})
