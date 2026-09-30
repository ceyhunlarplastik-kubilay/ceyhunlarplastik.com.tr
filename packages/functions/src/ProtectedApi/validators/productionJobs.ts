import { z } from "zod"

import { MAX_OUTPUT_QUANTITY } from "@/core/helpers/production/jobStateMachine"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionAreaRefSchema,
    productionIdParamsSchema,
    productionMachineRefSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — iş durum panosu. Geçiş kuralı ve tamamlama adetlerinin tamlığı handler'da
 * core `jobStateMachine.ts` ile; burada yalnız biçim.
 */

const jobStatusSchema = z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])
const orderStatusSchema = z.enum(["DRAFT", "PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"])

export const transitionProductionJobValidator = validatorWrapper(
    z.object({
        pathParameters: productionIdParamsSchema,
        body: z.object({
            status: z.enum(["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED", "COMPLETED"]),
            expectedVersion: z.number().int().min(0),
            outputs: z.array(z.object({
                jobOutputId: z.uuid(),
                goodQuantity: z.number().int().min(0).max(MAX_OUTPUT_QUANTITY),
                scrapQuantity: z.number().int().min(0).max(MAX_OUTPUT_QUANTITY),
            })).max(50).optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"], requiredBodyFields: ["status", "expectedVersion"] },
)

export const productionKanbanResponseValidator = productionResponse({
    generatedAt: z.string(),
    completedWindowDays: z.number(),
    jobs: z.array(z.object({
        id: z.uuid(),
        lotBaseNumber: z.number(),
        status: jobStatusSchema,
        version: z.number(),
        updatedAt: z.string(),
        machine: productionMachineRefSchema.extend({ area: productionAreaRefSchema }),
        mold: productionMachineRefSchema,
        setupStartAt: z.string(),
        productionStartAt: z.string(),
        plannedEndAt: z.string(),
        plannedShots: z.number(),
        colorHex: z.string().nullable(),
        colorName: z.string().nullable(),
        lotCount: z.number(),
        reportedLotCount: z.number(),
        outputs: z.array(z.object({
            id: z.uuid(),
            cavities: z.number(),
            plannedQuantity: z.number(),
            goodQuantity: z.number(),
            scrapQuantity: z.number(),
            reportedGoodQuantity: z.number(),
            reportedScrapQuantity: z.number(),
            sizeCode: z.string(),
            productName: z.string(),
            order: z.object({
                id: z.uuid(),
                orderNumber: z.string(),
                variantCode: z.string(),
                quantity: z.number(),
                dueDate: z.string().nullable(),
            }).loose().nullable(),
        }).loose()),
    }).loose()),
})

export const transitionProductionJobResponseValidator = productionResponse({
    job: z.object({ id: z.uuid(), status: jobStatusSchema, version: z.number() }).loose(),
    /** Türeyen durumu değişen emirler. */
    orders: z.array(z.object({ id: z.uuid(), status: orderStatusSchema }).loose()),
})
