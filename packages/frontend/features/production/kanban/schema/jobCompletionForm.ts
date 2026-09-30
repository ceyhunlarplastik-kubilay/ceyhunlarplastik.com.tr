import { z } from "zod"

import { MAX_OUTPUT_QUANTITY } from "@core/helpers/production/jobStateMachine"
import type { KanbanJob, TransitionJobInput } from "@/features/production/kanban/api/types"
import { requiredIntegerField } from "@/features/production/shared/formNumbers"

const quantityRange = { min: 0, max: MAX_OUTPUT_QUANTITY }

/** Tamamlama: işin her çıktısı için sağlam + fire (brüt baskı adedi değil, sahada sayılan). */
export const jobCompletionFormSchema = z.object({
    outputs: z.array(z.object({
        jobOutputId: z.string().min(1),
        goodQuantity: requiredIntegerField("Sağlam", quantityRange),
        scrapQuantity: requiredIntegerField("Fire", quantityRange),
    })).min(1),
})

export type JobCompletionFormInput = z.input<typeof jobCompletionFormSchema>
export type JobCompletionFormOutput = z.output<typeof jobCompletionFormSchema>

/**
 * Varsayılan: lot raporu girildiyse raporların toplamı; hiç rapor yoksa sağlam = planlanan, fire = 0.
 * İş toplamı lot toplamından ayrı saklanır — planlayıcı son sayımı burada düzeltebilir.
 */
export function jobCompletionDefaults(job: Pick<KanbanJob, "outputs" | "reportedLotCount">): JobCompletionFormInput {
    const reported = job.reportedLotCount > 0
    return {
        outputs: job.outputs.map((output) => ({
            jobOutputId: output.id,
            goodQuantity: String(reported ? output.reportedGoodQuantity : output.plannedQuantity),
            scrapQuantity: String(reported ? output.reportedScrapQuantity : 0),
        })),
    }
}

export function toCompletionInput(values: JobCompletionFormOutput, job: Pick<KanbanJob, "version">): TransitionJobInput {
    return { status: "COMPLETED", expectedVersion: job.version, outputs: values.outputs }
}
