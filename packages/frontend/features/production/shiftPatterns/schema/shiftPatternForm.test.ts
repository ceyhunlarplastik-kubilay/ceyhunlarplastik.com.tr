import { describe, expect, it } from "vitest"

import { SHIFT_PATTERN_PRESETS } from "@core/helpers/production/shiftPatterns"
import {
    buildShiftPatternPayload,
    createShiftPatternFormDefaults,
    shiftPatternFormSchema,
    toShiftDefinitionInput,
    toShiftFormValues,
} from "./shiftPatternForm"

describe("shiftPatternForm", () => {
    it("form satırı ↔ dakika dönüşümü kayıpsız (7,5 saat dahil)", () => {
        const definition = { code: "A", name: "Gündüz", startMinute: 450, durationMinutes: 450, daysOfWeek: [1, 2] }
        const formValues = toShiftFormValues(definition)

        expect(formValues.startTime).toBe("07:30")
        expect(formValues.durationHours).toBe("7,5")
        expect(toShiftDefinitionInput(formValues)).toEqual(definition)
    })

    it("yeni form ilk hazır şablonla başlar ve geçerlidir", () => {
        const defaults = createShiftPatternFormDefaults()
        const parsed = shiftPatternFormSchema.parse({ ...defaults, name: "Günde 24 saat" })

        expect(buildShiftPatternPayload(parsed).shifts).toEqual(SHIFT_PATTERN_PRESETS[0].shifts)
    })

    it("örtüşen vardiyaları sunucuyla aynı kuralla reddeder", () => {
        const defaults = createShiftPatternFormDefaults()
        const overlapping = {
            ...defaults,
            name: "Hatalı",
            shifts: [defaults.shifts[0], { ...defaults.shifts[1], startTime: "10:00" }],
        }

        const result = shiftPatternFormSchema.safeParse(overlapping)
        expect(result.success).toBe(false)
        expect(result.error?.issues.some((issue) => issue.path[0] === "shifts")).toBe(true)
    })
})
