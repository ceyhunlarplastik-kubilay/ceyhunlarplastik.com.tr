import { z } from "zod"

import {
    findShiftPatternIssues,
    formatMinuteOfDay,
    normalizeShiftDefinitions,
    parseMinuteOfDay,
    SHIFT_PATTERN_PRESETS,
    type ShiftDefinitionInput,
    type ShiftPatternIssueCode,
} from "@core/helpers/production/shiftPatterns"
import type { ShiftPattern, ShiftPatternInput } from "@/features/production/shiftPatterns/api/types"

/** Süre saat olarak yazılır: "8", "7,5", "7.25". */
const HOURS_PATTERN = /^\d{1,2}([.,]\d{1,2})?$/

/** Alan bazlı hatası formda zaten gösterilenler dışındaki DÜZEN seviyesi kurallar. */
const PATTERN_LEVEL_ISSUES: ShiftPatternIssueCode[] = ["OVERLAP", "EXCEEDS_DAY", "DUPLICATE_CODE", "TOO_MANY_SHIFTS"]

export const shiftFormSchema = z.object({
    code: z.string().trim().min(1, "Kod zorunlu").max(8, "En fazla 8 karakter"),
    name: z.string().trim().min(1, "Ad zorunlu").max(40, "En fazla 40 karakter"),
    startTime: z.string().refine((value) => parseMinuteOfDay(value) !== null, "Geçerli bir saat girin"),
    durationHours: z.string()
        .trim()
        .refine((value) => HOURS_PATTERN.test(value), "Saat olarak girin (ör. 8 veya 7,5)"),
    daysOfWeek: z.array(z.number()).min(1, "En az bir gün seçin"),
})

export type ShiftFormValues = z.input<typeof shiftFormSchema>

/** Form satırı → core'un beklediği tanım (dakika cinsinden). */
export function toShiftDefinitionInput(shift: ShiftFormValues): ShiftDefinitionInput {
    return {
        code: shift.code,
        name: shift.name,
        startMinute: parseMinuteOfDay(shift.startTime) ?? 0,
        durationMinutes: Math.round(Number(shift.durationHours.replace(",", ".")) * 60),
        daysOfWeek: shift.daysOfWeek,
    }
}

export function toShiftFormValues(shift: ShiftDefinitionInput): ShiftFormValues {
    return {
        code: shift.code,
        name: shift.name,
        startTime: formatMinuteOfDay(shift.startMinute),
        durationHours: String(Number((shift.durationMinutes / 60).toFixed(2))).replace(".", ","),
        daysOfWeek: [...shift.daysOfWeek],
    }
}

// Düzen kuralları sunucudakiyle AYNI fonksiyon (core `findShiftPatternIssues`).
export const shiftPatternFormSchema = z.object({
    name: z.string().trim().min(1, "Düzen adı zorunlu").max(80, "En fazla 80 karakter"),
    isDefault: z.boolean(),
    notes: z.string().trim().max(2000, "En fazla 2000 karakter"),
    shifts: z.array(shiftFormSchema).min(1, "En az bir vardiya ekleyin").max(4, "En fazla 4 vardiya"),
}).superRefine((values, ctx) => {
    const issues = findShiftPatternIssues(normalizeShiftDefinitions(values.shifts.map(toShiftDefinitionInput)))
    for (const issue of issues) {
        if (!PATTERN_LEVEL_ISSUES.includes(issue.code)) continue
        ctx.addIssue({ code: "custom", path: ["shifts"], message: issue.message })
    }
})

export type ShiftPatternFormInput = z.input<typeof shiftPatternFormSchema>
export type ShiftPatternFormValues = z.output<typeof shiftPatternFormSchema>

export function createShiftPatternFormDefaults(pattern?: ShiftPattern | null): ShiftPatternFormInput {
    if (!pattern) {
        return {
            name: "",
            isDefault: false,
            notes: "",
            shifts: SHIFT_PATTERN_PRESETS[0].shifts.map(toShiftFormValues),
        }
    }

    return {
        name: pattern.name,
        isDefault: pattern.isDefault,
        notes: pattern.notes ?? "",
        shifts: pattern.shifts.map(toShiftFormValues),
    }
}

export function buildShiftPatternPayload(values: ShiftPatternFormValues): ShiftPatternInput {
    return {
        name: values.name,
        isDefault: values.isDefault,
        notes: values.notes || null,
        shifts: values.shifts.map(toShiftDefinitionInput),
    }
}

/** Kayıtlı bir düzeni aynı içerikle yeniden göndermek için (ör. "varsayılan yap"). */
export function shiftPatternToInput(pattern: ShiftPattern, overrides: Partial<ShiftPatternInput> = {}): ShiftPatternInput {
    return {
        name: pattern.name,
        isDefault: pattern.isDefault,
        notes: pattern.notes,
        shifts: pattern.shifts.map(({ code, name, startMinute, durationMinutes, daysOfWeek }) => ({
            code,
            name,
            startMinute,
            durationMinutes,
            daysOfWeek,
        })),
        ...overrides,
    }
}
