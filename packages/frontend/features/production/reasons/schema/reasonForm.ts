import { z } from "zod"

import {
    findReasonIssues,
    normalizeReasonCode,
    STOP_CATEGORIES,
    type ProductionReasonKind,
    type ProductionStopCategory,
} from "@core/helpers/production/productionReasons"
import type { ProductionReason, ProductionReasonInput } from "@/features/production/reasons/api/types"
import { requiredIntegerField } from "@/features/production/shared/formNumbers"

/** Kural sunucuyla aynı fonksiyondan (`findReasonIssues`); kod büyük harfe normalleşir. */
export function reasonFormSchema(kind: ProductionReasonKind) {
    return z.object({
        code: z.string(),
        name: z.string(),
        stopCategory: z.string(),
        isActive: z.boolean(),
        sortOrder: requiredIntegerField("Sıra", { min: 0, max: 9999 }),
    }).superRefine((values, ctx) => {
        const stopCategory = kind === "STOP" && STOP_CATEGORIES.includes(values.stopCategory as ProductionStopCategory)
            ? values.stopCategory as ProductionStopCategory
            : null
        for (const issue of findReasonIssues({ kind, code: values.code, name: values.name, stopCategory })) {
            ctx.addIssue({ code: "custom", path: [issue.field], message: issue.message })
        }
    })
}

export type ReasonFormInput = z.input<ReturnType<typeof reasonFormSchema>>
export type ReasonFormOutput = z.output<ReturnType<typeof reasonFormSchema>>

export function reasonFormDefaults(kind: ProductionReasonKind, reason: ProductionReason | null, nextSortOrder: number): ReasonFormInput {
    return {
        code: reason?.code ?? "",
        name: reason?.name ?? "",
        stopCategory: reason?.stopCategory ?? (kind === "STOP" ? "BREAKDOWN" : ""),
        isActive: reason?.isActive ?? true,
        sortOrder: String(reason?.sortOrder ?? nextSortOrder),
    }
}

export function toReasonInput(kind: ProductionReasonKind, values: ReasonFormOutput): ProductionReasonInput {
    return {
        kind,
        code: normalizeReasonCode(values.code),
        name: values.name.trim(),
        stopCategory: kind === "STOP" ? values.stopCategory as ProductionStopCategory : null,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
    }
}
