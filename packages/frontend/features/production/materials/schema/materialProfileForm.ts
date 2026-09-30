import { z } from "zod"

import type { MaterialProfileInput, MaterialWithProfile } from "@/features/production/materials/api/types"
import {
    optionalDecimalField,
    optionalIntegerField,
    requiredDecimalField,
    toFieldText,
} from "@/features/production/shared/formNumbers"

export const materialProfileFormSchema = z.object({
    isMoldResin: z.boolean(),
    family: z.string().trim().max(40, "En fazla 40 karakter"),
    densityGCm3: optionalDecimalField("Yoğunluk", { min: 0.01, max: 30 }),
    requiresDrying: z.boolean(),
    dryingTempC: optionalIntegerField("Kurutma sıcaklığı", { min: 0, max: 400 }),
    dryingHours: optionalDecimalField("Kurutma süresi", { min: 0, max: 72 }),
    cycleTimeFactor: requiredDecimalField("Çevrim katsayısı", { min: 0.1, max: 10 }),
    purgeNote: z.string().trim().max(1000, "En fazla 1000 karakter"),
})

export type MaterialProfileFormInput = z.input<typeof materialProfileFormSchema>
export type MaterialProfileFormValues = z.output<typeof materialProfileFormSchema>

export function createMaterialProfileFormDefaults(material?: MaterialWithProfile | null): MaterialProfileFormInput {
    const profile = material?.profile
    return {
        isMoldResin: profile?.isMoldResin ?? true,
        family: profile?.family ?? material?.code ?? "",
        densityGCm3: toFieldText(profile?.densityGCm3),
        requiresDrying: profile?.requiresDrying ?? false,
        dryingTempC: toFieldText(profile?.dryingTempC),
        dryingHours: toFieldText(profile?.dryingHours),
        cycleTimeFactor: toFieldText(profile?.cycleTimeFactor ?? 1),
        purgeNote: profile?.purgeNote ?? "",
    }
}

export function buildMaterialProfilePayload(values: MaterialProfileFormValues): MaterialProfileInput {
    return {
        ...values,
        family: values.family || null,
        // Sunucu da temizliyor; formda da aynı kural ki kullanıcı ne kaydedildiğini görsün.
        dryingTempC: values.requiresDrying ? values.dryingTempC : null,
        dryingHours: values.requiresDrying ? values.dryingHours : null,
        purgeNote: values.purgeNote || null,
    }
}
