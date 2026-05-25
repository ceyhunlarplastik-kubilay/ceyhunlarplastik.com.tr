import { z } from "zod"

function parseOptionalDecimal(value: string) {
    const normalized = value.trim().replace(",", ".")
    if (!normalized) return undefined
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : Number.NaN
}

export const supplierBulkPricingSchema = z.object({
    operationalCostRate: z.string().trim(),
    profitRate: z.string().trim(),
}).superRefine((value, ctx) => {
    const operational = parseOptionalDecimal(value.operationalCostRate)
    const profit = parseOptionalDecimal(value.profitRate)

    if (operational === undefined && profit === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["operationalCostRate"],
            message: "En az bir oran girilmelidir.",
        })
        return
    }

    if (operational !== undefined && Number.isNaN(operational)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["operationalCostRate"],
            message: "Operasyonel maliyet yüzdesi geçerli bir sayı olmalıdır.",
        })
    }

    if (profit !== undefined && Number.isNaN(profit)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["profitRate"],
            message: "Kar oranı geçerli bir sayı olmalıdır.",
        })
    }
})

export type SupplierBulkPricingFormValues = z.infer<typeof supplierBulkPricingSchema>

export const SUPPLIER_BULK_PRICING_DEFAULT_VALUES: SupplierBulkPricingFormValues = {
    operationalCostRate: "",
    profitRate: "",
}

export function buildBulkPricingPayload(values: SupplierBulkPricingFormValues) {
    const operational = parseOptionalDecimal(values.operationalCostRate)
    const profit = parseOptionalDecimal(values.profitRate)

    return {
        ...(operational !== undefined && !Number.isNaN(operational)
            ? { operationalCostRate: operational }
            : {}),
        ...(profit !== undefined && !Number.isNaN(profit)
            ? { profitRate: profit }
            : {}),
    }
}
