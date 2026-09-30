import { z } from "zod"

import { MAX_OPERATORS_PER_SHIFT_CELL } from "@/core/helpers/production/shiftAssignments"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { operatorRefResponseSchema } from "@/functions/ProtectedApi/validators/productionLots"
import { productionAreaRefSchema, productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — vardiya ekibi. Hücrenin gerçekten çalışan bir vardiya olması, ekip seçimi
 * (tekrar, pasif operatör) ve kopyalama aralığı handler'da core `shiftAssignments.ts` ile.
 */

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const getShiftAssignmentsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({ date: dateKeySchema.optional() }).optional(),
    }),
    { requiredRootFields: [] },
)

export const replaceShiftAssignmentValidator = validatorWrapper(
    z.object({
        body: z.object({
            machineId: z.uuid(),
            shiftDate: dateKeySchema,
            shiftCode: z.string().min(1).max(10),
            operatorIds: z.array(z.uuid()).max(MAX_OPERATORS_PER_SHIFT_CELL),
        }),
    }),
    { requiredRootFields: ["body"], requiredBodyFields: ["machineId", "shiftDate", "shiftCode", "operatorIds"] },
)

export const copyShiftAssignmentsValidator = validatorWrapper(
    z.object({ body: z.object({ fromDate: dateKeySchema, toStart: dateKeySchema, toEnd: dateKeySchema }) }),
    { requiredRootFields: ["body"], requiredBodyFields: ["fromDate", "toStart", "toEnd"] },
)

export const shiftAssignmentsResponseValidator = productionResponse({
    date: z.string(),
    machines: z.array(z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        status: z.enum(["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"]),
        area: productionAreaRefSchema,
        shiftPatternName: z.string().nullable(),
        exception: z.enum(["HOLIDAY", "SHUTDOWN", "EXTRA_WORKDAY"]).nullable(),
        shifts: z.array(z.object({
            code: z.string(),
            name: z.string(),
            startAt: z.string(),
            endAt: z.string(),
            operatorIds: z.array(z.uuid()),
        }).loose()),
        /** O gün çalışılmayan hücrede kalmış atamalar (düzen / takvim sonradan değişmiş). */
        orphans: z.array(z.object({ shiftCode: z.string(), operatorIds: z.array(z.uuid()) }).loose()),
    }).loose()),
    operators: z.array(operatorRefResponseSchema),
})

export const replaceShiftAssignmentResponseValidator = productionResponse({
    cell: z.object({
        machineId: z.uuid(),
        shiftDate: z.string(),
        shiftCode: z.string(),
        operatorIds: z.array(z.uuid()),
    }).loose(),
})

export const copyShiftAssignmentsResponseValidator = productionResponse({
    days: z.number(),
    created: z.number(),
})
