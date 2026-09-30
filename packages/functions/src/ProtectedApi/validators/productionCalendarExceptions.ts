import { z } from "zod"

import { MAX_CALENDAR_EXCEPTION_DAYS } from "@/core/helpers/production/productionCalendar"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import {
    productionAreaRefSchema,
    productionMachineRefSchema,
    productionResponse,
} from "@/functions/ProtectedApi/validators/productionShared"

/**
 * Üretim planlama — takvim istisnaları (bayram / toplu izin / ek mesai). Kayıt gün
 * başınadır; istek bir ARALIK taşır ve günlere açılarak yazılır. Tarih sırası, gün
 * sayısı ve kapsam kuralları handler'da (core `findCalendarExceptionIssues`).
 */

const calendarExceptionKindSchema = z.enum(["HOLIDAY", "SHUTDOWN", "EXTRA_WORKDAY"])

/** Düzenlenen kaydın günleri — birleştirilmiş uzun kayıtlar için sınır geniş tutuldu. */
const MAX_REPLACE_IDS = MAX_CALENDAR_EXCEPTION_DAYS * 6

export const listCalendarExceptionsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            from: z.iso.date().optional(),
            to: z.iso.date().optional(),
        }).optional(),
    }),
    { requiredRootFields: [] },
)

export const saveCalendarExceptionEntryValidator = validatorWrapper(
    z.object({
        body: z.object({
            startDate: z.iso.date(),
            endDate: z.iso.date().nullable().optional(),
            kind: calendarExceptionKindSchema,
            note: z.string().trim().max(160).nullable().optional(),
            areaId: z.uuid().nullable().optional(),
            machineId: z.uuid().nullable().optional(),
            replaceIds: z.array(z.uuid()).max(MAX_REPLACE_IDS).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["startDate", "kind"],
    },
)

export const bulkDeleteCalendarExceptionsValidator = validatorWrapper(
    z.object({
        body: z.object({
            ids: z.array(z.uuid()).min(1).max(MAX_REPLACE_IDS),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["ids"],
    },
)

// ---- Response ----

const calendarExceptionResponseSchema = z.object({
    id: z.uuid(),
    date: z.string(),
    kind: calendarExceptionKindSchema,
    note: z.string().nullable(),
    areaId: z.uuid().nullable(),
    area: productionAreaRefSchema.nullable(),
    machineId: z.uuid().nullable(),
    machine: productionMachineRefSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const listCalendarExceptionsResponseValidator = productionResponse({
    exceptions: z.array(calendarExceptionResponseSchema),
})

export const bulkDeleteCalendarExceptionsResponseValidator = productionResponse({
    deletedCount: z.number(),
})
