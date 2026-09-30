import { z } from "zod"

import { MAX_CARD_CYCLE_SEC } from "@core/helpers/production/moldStats"
import { optionalDecimalField, toFieldText } from "@/features/production/shared/formNumbers"
import type { ProductionVariant } from "@/features/production/variants/api/types"

/** Boş bırakılırsa varyant çevrimi kaldırılır (sunucu sınırıyla aynı aralık). */
export const variantCycleFormSchema = z.object({
    cycleTimeSec: optionalDecimalField("Çevrim", { min: 0.1, max: MAX_CARD_CYCLE_SEC }),
})

export type VariantCycleFormInput = z.input<typeof variantCycleFormSchema>
export type VariantCycleFormValues = z.output<typeof variantCycleFormSchema>

export function createVariantCycleFormDefaults(variant?: ProductionVariant | null): VariantCycleFormInput {
    return { cycleTimeSec: toFieldText(variant?.cycleTimeSec) }
}
