import { z } from "zod"

import { MAX_OUTPUT_QUANTITY } from "@/core/helpers/production/jobStateMachine"
import { MAX_LOT_DURATION_MINUTES } from "@/core/helpers/production/lotReports"
import {
    LOT_NOTE_CATEGORIES,
    LOT_NUMBER_PATTERN,
    MAX_LOT_NOTE_LENGTH,
    MAX_OPERATORS_PER_LOT,
} from "@/core/helpers/production/productionLots"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionIdParamsSchema,
    productionMachineRefSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — lotlar ve lot notları. Not metninin kırpılmış hâli, ekip seçimi (tekrar,
 * pasif operatör) ve silme yetkisi handler'da core `productionLots.ts` / `shiftAssignments.ts` ile.
 */

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const lotNumberParamsSchema = z.object({ lotNumber: z.string().regex(LOT_NUMBER_PATTERN) })
const noteCategorySchema = z.enum(LOT_NOTE_CATEGORIES as [string, ...string[]])
const jobStatusSchema = z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])
const lotStatusSchema = z.enum(["PLANNED", "RUNNING", "COMPLETED", "CANCELLED"])

export const listProductionLotsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().regex(/^\d{1,6}$/).optional(),
            limit: z.string().regex(/^\d{1,3}$/).optional(),
            from: dateKeySchema.optional(),
            to: dateKeySchema.optional(),
            machineId: z.uuid().optional(),
            q: z.string().max(100).optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const getProductionLotValidator = validatorWrapper(
    z.object({ pathParameters: lotNumberParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

export const replaceProductionLotOperatorsValidator = validatorWrapper(
    z.object({
        pathParameters: lotNumberParamsSchema,
        body: z.object({ operatorIds: z.array(z.uuid()).max(MAX_OPERATORS_PER_LOT) }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["operatorIds"] },
)

export const createProductionLotNoteValidator = validatorWrapper(
    z.object({
        pathParameters: lotNumberParamsSchema,
        body: z.object({
            category: noteCategorySchema,
            body: z.string().min(1).max(MAX_LOT_NOTE_LENGTH),
            operatorId: z.uuid().nullable().optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["category", "body"] },
)

export const deleteProductionLotNoteValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Yanıtlar ----

export const operatorRefResponseSchema = z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    employeeNo: z.string().nullable(),
    isActive: z.boolean(),
}).loose()

const lotOperatorsResponseSchema = z.object({
    source: z.enum(["lot", "roster", "none"]),
    list: z.array(operatorRefResponseSchema),
}).loose()

const lotOutputResponseSchema = z.object({
    jobOutputId: z.uuid(),
    scrapReasons: z.array(z.object({
        reason: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
        quantity: z.number(),
    }).loose()),
    sizeCode: z.string(),
    productName: z.string(),
    cavities: z.number(),
    plannedQuantity: z.number(),
    goodQuantity: z.number(),
    scrapQuantity: z.number(),
    order: z.object({
        id: z.uuid(),
        orderNumber: z.string(),
        variantCode: z.string(),
        quantity: z.number(),
        dueDate: z.string().nullable(),
    }).loose().nullable(),
}).loose()

const lotJobResponseSchema = z.object({
    id: z.uuid(),
    lotBaseNumber: z.number(),
    status: jobStatusSchema,
    version: z.number(),
    machine: productionMachineRefSchema,
    mold: productionMachineRefSchema,
}).loose()

const lotListItemResponseSchema = z.object({
    id: z.uuid(),
    lotNumber: z.string(),
    sequence: z.number(),
    shiftDate: z.string(),
    shiftCode: z.string(),
    plannedStartAt: z.string(),
    plannedEndAt: z.string(),
    plannedShots: z.number(),
    status: lotStatusSchema,
    actualStartAt: z.string().nullable(),
    actualEndAt: z.string().nullable(),
    actualShots: z.number().nullable(),
    reportedAt: z.string().nullable(),
    stopMinutes: z.number(),
    job: lotJobResponseSchema,
    colorHex: z.string().nullable(),
    colorName: z.string().nullable(),
    outputs: z.array(lotOutputResponseSchema),
    operators: lotOperatorsResponseSchema,
    noteCount: z.number(),
}).loose()

const lotNoteResponseSchema = z.object({
    id: z.uuid(),
    category: noteCategorySchema,
    body: z.string(),
    createdAt: z.string(),
    authorUserId: z.uuid().nullable(),
    author: z.object({ id: z.uuid(), firstName: z.string().nullable(), lastName: z.string().nullable() }).loose().nullable(),
    operator: operatorRefResponseSchema.nullable(),
    canDelete: z.boolean(),
}).loose()

export const listProductionLotsResponseValidator = productionResponse({
    data: z.array(lotListItemResponseSchema),
    meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }).loose(),
    /** Uygulanan tarih aralığı; arama varsa `null` (tüm tarihler). */
    range: z.object({ from: z.string(), to: z.string() }).loose().nullable(),
})

export const productionLotResponseValidator = productionResponse({
    lot: lotListItemResponseSchema.extend({
        job: lotJobResponseSchema.extend({
            setupStartAt: z.string(),
            productionStartAt: z.string(),
            plannedEndAt: z.string(),
            plannedShots: z.number(),
            cycleTimeSec: z.number(),
        }),
        siblings: z.array(z.object({
            lotNumber: z.string(),
            sequence: z.number(),
            shiftDate: z.string(),
            shiftCode: z.string(),
            plannedStartAt: z.string(),
            plannedEndAt: z.string(),
            status: lotStatusSchema,
            reportedAt: z.string().nullable(),
        }).loose()),
        reportedBy: z.object({ id: z.uuid(), firstName: z.string().nullable(), lastName: z.string().nullable() }).loose().nullable(),
        stops: z.array(z.object({
            id: z.uuid(),
            durationMinutes: z.number(),
            startAt: z.string().nullable(),
            note: z.string().nullable(),
            reason: z.object({ id: z.uuid(), code: z.string(), name: z.string(), stopCategory: z.string().nullable() }).loose(),
        }).loose()),
        /** Vardiya ekibinin bu hücre için söylediği (lota özel ekip varken de gösterilir). */
        rosterOperators: z.array(operatorRefResponseSchema),
        notes: z.array(lotNoteResponseSchema),
    }),
})

export const replaceProductionLotOperatorsResponseValidator = productionResponse({
    operators: lotOperatorsResponseSchema,
})

export const productionLotNoteResponseValidator = productionResponse({
    note: lotNoteResponseSchema,
})

export const deleteProductionLotNoteResponseValidator = productionResponse({
    id: z.uuid(),
})

// ---- Vardiya raporu (Dilim 4.2) ----

const countSchema = z.number().int().min(0).max(MAX_OUTPUT_QUANTITY)

export const startProductionLotValidator = validatorWrapper(
    z.object({
        pathParameters: lotNumberParamsSchema,
        body: z.object({ startedAt: z.iso.datetime().optional(), expectedVersion: z.number().int().min(0) }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["expectedVersion"] },
)

export const reportProductionLotValidator = validatorWrapper(
    z.object({
        pathParameters: lotNumberParamsSchema,
        body: z.object({
            actualStartAt: z.iso.datetime(),
            actualEndAt: z.iso.datetime(),
            actualShots: countSchema.nullable().optional(),
            outputs: z.array(z.object({
                jobOutputId: z.uuid(),
                goodQuantity: countSchema,
                scrapQuantity: countSchema,
                scrapReasons: z.array(z.object({ reasonId: z.uuid(), quantity: z.number().int().min(1).max(MAX_OUTPUT_QUANTITY) })).max(30),
            })).min(1).max(50),
            stops: z.array(z.object({
                reasonId: z.uuid(),
                durationMinutes: z.number().int().min(1).max(MAX_LOT_DURATION_MINUTES),
                startAt: z.iso.datetime().nullable().optional(),
                note: z.string().max(500).nullable().optional(),
            })).max(50),
            handoverNote: z.object({ body: z.string().min(1).max(MAX_LOT_NOTE_LENGTH), operatorId: z.uuid().nullable().optional() }).nullable().optional(),
            expectedVersion: z.number().int().min(0),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["actualStartAt", "actualEndAt", "outputs", "stops", "expectedVersion"] },
)

export const startProductionLotResponseValidator = productionResponse({
    lotNumber: z.string(),
    jobVersion: z.number(),
})

export const reportProductionLotResponseValidator = productionResponse({
    lotNumber: z.string(),
    jobVersion: z.number(),
    shots: z.number(),
    /** Kendiliğinden başlayan sıradaki lot; yoksa `null`. */
    nextLotNumber: z.string().nullable(),
    correction: z.boolean(),
})
