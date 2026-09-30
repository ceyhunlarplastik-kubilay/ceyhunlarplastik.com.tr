import { z } from "zod"

import { MAX_PRODUCTION_ORDER_QUANTITY } from "@/core/helpers/production/productionOrders"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    moldSummarySchema,
    productSizeRefResponseSchema,
    variantVersionResponseSchema,
} from "@/functions/ProtectedApi/validators/productionReferences"
import { productionIdParamsSchema, productionResponse } from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — üretim emirleri. Çapraz kurallar (müşteri siparişinde müşteri zorunlu,
 * elle durum geçişleri, düzenlenebilirlik) handler'da core `productionOrders.ts` ile.
 */

const statusSchema = z.enum(["DRAFT", "PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"])
const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"])
const sourceSchema = z.enum(["MANUAL", "STOCK", "CUSTOMER_ORDER"])
const placementSchema = z.enum(["first-gap", "push-later"])

const orderBodySchema = z.object({
    productVariantId: z.uuid(),
    quantity: z.number().int().min(1).max(MAX_PRODUCTION_ORDER_QUANTITY),
    dueDate: z.iso.date().nullable().optional(),
    priority: prioritySchema.optional(),
    source: sourceSchema.optional(),
    customerId: z.uuid().nullable().optional(),
    cycleTimeOverrideSec: z.number().min(0.1).max(3600).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
})

export const listProductionOrdersValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().regex(/^\d{1,6}$/).optional(),
            limit: z.string().regex(/^\d{1,3}$/).optional(),
            q: z.string().max(100).optional(),
            status: z.union([z.enum(["open", "all"]), statusSchema]).optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const createProductionOrderValidator = validatorWrapper(
    z.object({ body: orderBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productVariantId", "quantity"],
    },
)

export const updateProductionOrderValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: orderBodySchema.partial().extend({ status: statusSchema.optional() }),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductionOrderValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

// ---- Response ----

const jobStatusSchema = z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])

const orderJobSchema = z.object({
    id: z.uuid(),
    lotBaseNumber: z.number(),
    status: jobStatusSchema,
    machine: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
    mold: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
    setupStartAt: z.string(),
    plannedEndAt: z.string(),
    plannedQuantity: z.number(),
    lots: z.array(z.object({
        lotNumber: z.string(),
        sequence: z.number(),
        shiftDate: z.string(),
        shiftCode: z.string(),
        plannedStartAt: z.string(),
        plannedEndAt: z.string(),
        plannedQuantity: z.number(),
    }).loose()),
}).loose()

const productionOrderResponseSchema = z.object({
    id: z.uuid(),
    orderNumber: z.number(),
    jobs: z.array(orderJobSchema),
    productVariantId: z.uuid().nullable(),
    variantCode: z.string(),
    quantity: z.number(),
    dueDate: z.string().nullable(),
    priority: prioritySchema,
    source: sourceSchema,
    customerId: z.uuid().nullable(),
    customer: z.object({ id: z.uuid(), name: z.string() }).loose().nullable(),
    cycleTimeOverrideSec: z.number().nullable(),
    status: statusSchema,
    notes: z.string().nullable(),
    createdByUserId: z.uuid().nullable(),
    createdByUser: z.object({
        id: z.uuid(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
    }).loose().nullable(),
    productVariant: z.object({
        id: z.uuid(),
        fullCode: z.string(),
        product: z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose(),
        size: productSizeRefResponseSchema,
        version: variantVersionResponseSchema,
        cycleTimeSec: z.number().nullable(),
        molds: z.array(moldSummarySchema),
    }).loose().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listProductionOrdersResponseValidator = productionResponse({
    data: z.array(productionOrderResponseSchema),
    meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }).loose(),
})

export const productionOrderResponseValidator = productionResponse({
    order: productionOrderResponseSchema,
})

export const deleteProductionOrderResponseValidator = productionResponse({
    id: z.uuid(),
})

export const getProductionOrderCandidatesValidator = deleteProductionOrderValidator

export const planProductionOrderValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: z.object({
            machineId: z.uuid(),
            moldId: z.uuid().optional(),
            startAt: z.iso.datetime().optional(),
            placement: placementSchema.optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["machineId"] },
)

const shiftedJobsSchema = z.array(z.object({
    id: z.uuid(),
    lotBaseNumber: z.number(),
    fromStartAt: z.string(),
    toStartAt: z.string(),
}).loose())

export const planProductionOrderResponseValidator = productionResponse({
    order: productionOrderResponseSchema,
    /** İstenen an doluydu / vardiya dışıydı → ilk uygun boşluğa kaydı. */
    shifted: z.boolean(),
    /** "Sonrakileri kaydır" ile yeri değişen işler. */
    shiftedJobs: shiftedJobsSchema,
})

export const deleteProductionJobValidator = deleteProductionOrderValidator

export const deleteProductionJobResponseValidator = deleteProductionOrderResponseValidator

export const rescheduleProductionJobValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: z.object({
            machineId: z.uuid(),
            startAt: z.iso.datetime(),
            expectedVersion: z.number().int().min(0),
            placement: placementSchema.optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["machineId", "startAt", "expectedVersion"] },
)

export const rescheduleProductionJobResponseValidator = productionResponse({
    job: z.object({
        id: z.uuid(),
        version: z.number(),
        machineId: z.uuid(),
        setupStartAt: z.string(),
        productionStartAt: z.string(),
        plannedEndAt: z.string(),
        lotCount: z.number(),
    }).loose(),
    requestedStartAt: z.string(),
    /** İstenen an doluydu / vardiya dışıydı → iş ilk uygun boşluğa kaydı. */
    shifted: z.boolean(),
    shiftedJobs: shiftedJobsSchema,
})

const plannedLotSchema = z.object({
    sequence: z.number(),
    workday: z.string(),
    shiftCode: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    shots: z.number(),
    quantity: z.number(),
}).loose()

const refSchema = z.object({ id: z.uuid(), code: z.string(), name: z.string() }).loose()

export const productionOrderCandidatesResponseValidator = productionResponse({
    order: z.object({
        id: z.uuid(),
        orderNumber: z.number(),
        quantity: z.number(),
        dueDate: z.string().nullable(),
        variantCode: z.string(),
    }).loose(),
    generatedAt: z.string(),
    horizonDays: z.number(),
    candidates: z.array(z.object({
        machine: refSchema,
        mold: refSchema,
        cavities: z.number(),
        verdict: z.enum(["ok", "warning", "unknown"]),
        notes: z.array(z.string()),
        isPreferred: z.boolean(),
        cycleTimeSec: z.number(),
        cycleSource: z.enum(["order", "machineCard", "variant", "mold"]),
        shots: z.number(),
        setupMinutes: z.number(),
        productionMinutes: z.number(),
        setupStartAt: z.string().nullable(),
        productionStartAt: z.string().nullable(),
        endAt: z.string().nullable(),
        meetsDueDate: z.boolean().nullable(),
        machineCost: z.number().nullable(),
        currency: z.string(),
        lots: z.array(plannedLotSchema),
        isEarliest: z.boolean(),
        isCheapest: z.boolean(),
        missingShiftPattern: z.boolean(),
    }).loose()),
    excluded: z.array(z.object({
        machineCode: z.string(),
        moldCode: z.string(),
        reasons: z.array(z.string()),
    }).loose()),
})

export const pushJobFollowersValidator = validatorWrapper(
    z.object({ pathParameters: productionIdParamsSchema }),
    { requiredRootFields: ["pathParameters"] },
)

export const pushJobFollowersResponseValidator = productionResponse({
    projectedEndAt: z.string(),
    delayMinutes: z.number(),
    shiftedJobs: shiftedJobsSchema,
})
