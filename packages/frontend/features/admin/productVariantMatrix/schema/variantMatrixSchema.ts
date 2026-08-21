import { z } from "zod"

/**
 * Matris taslak satırı. Ölçü değerleri METİN olarak tutulur: operatör "M4" veya
 * "12,5" yazabilir; sayıya çevirme `parseMeasurementValue` ile yapılır (core'daki
 * `parseMeasurementInput` ile aynı kuralları uygular).
 */
export const variantMatrixDraftRowSchema = z.object({
    measurements: z.record(z.string(), z.string()),
    colorId: z.string().optional(),
    materialIds: z.array(z.string()).default([]),
    supplierId: z.string().optional(),
    supplierVariantCode: z.string().max(120).optional(),
    hasSupplierLogo: z.boolean().default(false),
    price: z.string().optional(),
    minOrderQty: z.string().optional(),
    unitsPerPackage: z.string().optional(),
    packageLengthMm: z.string().optional(),
    packageWidthMm: z.string().optional(),
    packageHeightMm: z.string().optional(),
    packageWeightKg: z.string().optional(),
    minLeadTimeDays: z.string().optional(),
})

export type VariantMatrixDraftRow = z.infer<typeof variantMatrixDraftRowSchema>

export function createEmptyDraftRow(defaults?: Partial<VariantMatrixDraftRow>): VariantMatrixDraftRow {
    return {
        measurements: {},
        colorId: undefined,
        materialIds: [],
        supplierId: undefined,
        supplierVariantCode: undefined,
        hasSupplierLogo: false,
        price: undefined,
        minOrderQty: undefined,
        unitsPerPackage: undefined,
        packageLengthMm: undefined,
        packageWidthMm: undefined,
        packageHeightMm: undefined,
        packageWeightKg: undefined,
        minLeadTimeDays: undefined,
        ...defaults,
    }
}

const METRIC_THREAD_CODES = ["D", "M"]
const METRIC_THREAD_PATTERN = /^M?\s*(\d+(?:[.,]\d+)?)$/i

/**
 * Ölçü girdisini sayıya çevirir. Core'daki `parseMeasurementInput` ile AYNI kuralı
 * uygular: `M`/`D` kodları metrik diş sayılır ("M4" → 4), diğerlerinde virgül
 * ondalık ayırıcı olarak kabul edilir ("12,5" → 12.5).
 */
export function parseMeasurementValue(raw: string, measurementCode: string): number | null {
    const normalized = raw.trim()
    if (!normalized) return null

    if (METRIC_THREAD_CODES.includes(measurementCode)) {
        const match = normalized.match(METRIC_THREAD_PATTERN)
        if (!match) return null
        const parsed = Number(match[1].replace(",", "."))
        return Number.isFinite(parsed) ? parsed : null
    }

    const parsed = Number(normalized.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : null
}

export function parseOptionalNumber(raw: string | undefined): number | undefined {
    if (!raw?.trim()) return undefined
    const parsed = Number(raw.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
}

export function parseOptionalInteger(raw: string | undefined): number | undefined {
    const parsed = parseOptionalNumber(raw)
    return parsed === undefined ? undefined : Math.round(parsed)
}
