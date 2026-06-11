export type CustomerVariantPaymentScheduleStep = {
    percentage: number
    paymentTermDays: number
    label: string
    note: string | null
}

function roundPercent(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null
}

export function normalizeCustomerVariantPaymentSchedule(value: unknown): CustomerVariantPaymentScheduleStep[] | null {
    if (!Array.isArray(value)) return null

    const steps = value.flatMap((item) => {
        const record = asRecord(item)
        if (!record) return []

        const percentage = Number(record.percentage)
        const paymentTermDays = Number(record.paymentTermDays)
        const label = typeof record.label === "string" ? record.label.trim() : ""
        const note = typeof record.note === "string" && record.note.trim()
            ? record.note.trim()
            : null

        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) return []
        if (!Number.isInteger(paymentTermDays) || paymentTermDays < 0) return []
        if (!label) return []

        return [{
            percentage: roundPercent(percentage),
            paymentTermDays,
            label,
            note,
        }]
    })

    return steps.length > 0 ? steps : null
}

export function formatCustomerVariantPaymentScheduleLabel(
    paymentSchedule: CustomerVariantPaymentScheduleStep[] | null | undefined,
    fallback?: string | null,
) {
    if (!paymentSchedule?.length) return fallback ?? null

    return paymentSchedule
        .map((step) => `%${step.percentage.toLocaleString("tr-TR", {
            maximumFractionDigits: 2,
        })} ${step.label}`)
        .join(" + ")
}
