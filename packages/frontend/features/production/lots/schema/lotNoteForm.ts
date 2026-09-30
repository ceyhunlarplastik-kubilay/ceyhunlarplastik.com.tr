import { z } from "zod"

import { findLotNoteIssue, LOT_NOTE_CATEGORIES, type ProductionLotNoteCategory } from "@core/helpers/production/productionLots"
import type { LotNoteInput } from "@/features/production/lots/api/types"

/** Not kuralı sunucuyla aynı fonksiyondan (`findLotNoteIssue`); "operatör adına" opsiyonel. */
export const lotNoteFormSchema = z.object({
    category: z.enum(LOT_NOTE_CATEGORIES as [ProductionLotNoteCategory, ...ProductionLotNoteCategory[]]),
    operatorId: z.string(),
    body: z.string(),
}).superRefine((values, ctx) => {
    const issue = findLotNoteIssue(values.body)
    if (issue) ctx.addIssue({ code: "custom", path: ["body"], message: issue })
})

export type LotNoteFormValues = z.infer<typeof lotNoteFormSchema>

/** Operatör seçilmediğinde Select'in değeri. */
export const NO_OPERATOR = "__none__"

export const lotNoteFormDefaults: LotNoteFormValues = { category: "GENERAL", operatorId: NO_OPERATOR, body: "" }

export function toLotNoteInput(values: LotNoteFormValues): LotNoteInput {
    return {
        category: values.category,
        body: values.body.trim(),
        operatorId: values.operatorId === NO_OPERATOR ? null : values.operatorId,
    }
}
