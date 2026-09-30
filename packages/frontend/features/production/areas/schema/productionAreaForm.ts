import { z } from "zod"

import type { ProductionArea, ProductionAreaInput } from "@/features/production/areas/api/types"
import { requiredIntegerField } from "@/features/production/shared/formNumbers"

/** `shiftPatternId` "" = alan kendi düzenini seçmedi, varsayılan düzen geçerli. */
export const productionAreaFormSchema = z.object({
    code: z.string().trim().min(1, "Kod zorunlu").max(20, "En fazla 20 karakter"),
    name: z.string().trim().min(1, "Ad zorunlu").max(120, "En fazla 120 karakter"),
    sortOrder: requiredIntegerField("Sıra", { min: 0, max: 9999 }),
    isActive: z.boolean(),
    notes: z.string().trim().max(2000, "En fazla 2000 karakter"),
    shiftPatternId: z.string(),
})

export type ProductionAreaFormInput = z.input<typeof productionAreaFormSchema>
export type ProductionAreaFormValues = z.output<typeof productionAreaFormSchema>

export function createProductionAreaFormDefaults(area?: ProductionArea | null): ProductionAreaFormInput {
    return {
        code: area?.code ?? "",
        name: area?.name ?? "",
        sortOrder: String(area?.sortOrder ?? 0),
        isActive: area?.isActive ?? true,
        notes: area?.notes ?? "",
        shiftPatternId: area?.shiftPatternId ?? "",
    }
}

export function buildProductionAreaPayload(values: ProductionAreaFormValues): ProductionAreaInput {
    return {
        code: values.code,
        name: values.name,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        notes: values.notes || null,
        shiftPatternId: values.shiftPatternId || null,
    }
}
