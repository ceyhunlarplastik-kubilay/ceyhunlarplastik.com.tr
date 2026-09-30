import { z } from "zod"

import { utcToWallTime, wallTimeToUtc } from "@core/helpers/production/productionTime"
import type { BoardJob, RescheduleJobInput } from "@/features/production/board/api/types"

/**
 * "Taşı" formu — sürükle-bırakın klavye alternatifi. Saat FABRİKA saatiyle girilir
 * (`datetime-local`, tarayıcının saat dilimi kullanılmaz).
 */
export const boardMoveFormSchema = z.object({
    machineId: z.string().min(1, "Makine seçin."),
    startAt: z.string().refine((value) => wallTimeToUtc(value) !== null, "Geçerli bir tarih ve saat girin."),
})

export type BoardMoveFormValues = z.infer<typeof boardMoveFormSchema>

export function boardMoveFormDefaults(job: BoardJob): BoardMoveFormValues {
    return { machineId: job.machineId, startAt: utcToWallTime(job.setupStartAt) }
}

export function toRescheduleInput(values: BoardMoveFormValues, job: Pick<BoardJob, "version">): RescheduleJobInput {
    return {
        machineId: values.machineId,
        startAt: (wallTimeToUtc(values.startAt) as Date).toISOString(),
        expectedVersion: job.version,
    }
}
