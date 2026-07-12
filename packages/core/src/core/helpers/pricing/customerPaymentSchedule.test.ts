import { describe, expect, it } from "vitest"
import {
    formatCustomerVariantPaymentScheduleLabel,
    normalizeCustomerVariantPaymentSchedule,
} from "./customerPaymentSchedule"

describe("normalizeCustomerVariantPaymentSchedule", () => {
    it("returns null for non-array input", () => {
        expect(normalizeCustomerVariantPaymentSchedule(null)).toBeNull()
        expect(normalizeCustomerVariantPaymentSchedule(undefined)).toBeNull()
        expect(normalizeCustomerVariantPaymentSchedule({})).toBeNull()
        expect(normalizeCustomerVariantPaymentSchedule("50 peşin")).toBeNull()
    })

    it("normalizes the canonical %50 peşin + %50 30 gün schedule", () => {
        const steps = normalizeCustomerVariantPaymentSchedule([
            { percentage: 50, paymentTermDays: 0, label: "peşin" },
            { percentage: 50, paymentTermDays: 30, label: "30 gün", note: "  fatura sonrası  " },
        ])

        expect(steps).toEqual([
            { percentage: 50, paymentTermDays: 0, label: "peşin", note: null },
            { percentage: 50, paymentTermDays: 30, label: "30 gün", note: "fatura sonrası" },
        ])
    })

    it("drops steps with invalid percentage, term days or empty label", () => {
        const steps = normalizeCustomerVariantPaymentSchedule([
            { percentage: 0, paymentTermDays: 0, label: "sıfır yüzde" },
            { percentage: 101, paymentTermDays: 0, label: "yüzü aşan" },
            { percentage: "abc", paymentTermDays: 0, label: "sayı değil" },
            { percentage: 50, paymentTermDays: -1, label: "negatif vade" },
            { percentage: 50, paymentTermDays: 1.5, label: "küsuratlı vade" },
            { percentage: 50, paymentTermDays: 30, label: "   " },
            { percentage: 40, paymentTermDays: 30, label: "geçerli" },
        ])

        expect(steps).toEqual([
            { percentage: 40, paymentTermDays: 30, label: "geçerli", note: null },
        ])
    })

    it("skips non-object items and returns null when nothing survives", () => {
        expect(
            normalizeCustomerVariantPaymentSchedule(["peşin", null, 42, []]),
        ).toBeNull()
        expect(normalizeCustomerVariantPaymentSchedule([])).toBeNull()
    })

    it("rounds percentages to 2 decimals", () => {
        const steps = normalizeCustomerVariantPaymentSchedule([
            { percentage: 33.333333, paymentTermDays: 0, label: "üçte bir" },
        ])

        expect(steps?.[0]?.percentage).toBe(33.33)
    })
})

describe("formatCustomerVariantPaymentScheduleLabel", () => {
    it("joins steps in display form", () => {
        const label = formatCustomerVariantPaymentScheduleLabel([
            { percentage: 50, paymentTermDays: 0, label: "peşin", note: null },
            { percentage: 50, paymentTermDays: 30, label: "30 gün", note: null },
        ])

        expect(label).toBe("%50 peşin + %50 30 gün")
    })

    it("formats fractional percentages with the tr-TR decimal comma", () => {
        const label = formatCustomerVariantPaymentScheduleLabel([
            { percentage: 33.33, paymentTermDays: 0, label: "peşin", note: null },
        ])

        expect(label).toBe("%33,33 peşin")
    })

    it("falls back when the schedule is empty or missing", () => {
        expect(formatCustomerVariantPaymentScheduleLabel(null, "30 gün vade")).toBe("30 gün vade")
        expect(formatCustomerVariantPaymentScheduleLabel([], "30 gün vade")).toBe("30 gün vade")
        expect(formatCustomerVariantPaymentScheduleLabel(undefined)).toBeNull()
    })
})
