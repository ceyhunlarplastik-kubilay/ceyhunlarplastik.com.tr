import { z } from "zod"

export type VariantPriceBounds = {
    min: number
    max: number
    currency: string
}

export type AppliedVariantFilters = {
    colorIds: string[]
    materialIds: string[]
    minPrice: number | null
    maxPrice: number | null
}

export const customerPortalVariantFilterSchema = z
    .object({
        colorIds: z.array(z.string()).default([]),
        materialIds: z.array(z.string()).default([]),
        minPrice: z.string().default(""),
        maxPrice: z.string().default(""),
    })
    .superRefine((value, ctx) => {
        const minPrice = parseVariantFilterPrice(value.minPrice)
        const maxPrice = parseVariantFilterPrice(value.maxPrice)

        if (minPrice !== null && minPrice < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["minPrice"],
                message: "Minimum fiyat 0 veya daha büyük olmalıdır.",
            })
        }

        if (maxPrice !== null && maxPrice < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["maxPrice"],
                message: "Maksimum fiyat 0 veya daha büyük olmalıdır.",
            })
        }

        if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["maxPrice"],
                message: "Maksimum fiyat, minimum fiyattan küçük olamaz.",
            })
        }
    })

export type CustomerPortalVariantFilterFormValues = z.input<typeof customerPortalVariantFilterSchema>
export type CustomerPortalVariantFilterValues = z.output<typeof customerPortalVariantFilterSchema>

export function parseVariantFilterPrice(value: string | null | undefined) {
    if (!value) return null

    const compact = value.replace(/\s/g, "").trim()
    if (!compact) return null

    const lastComma = compact.lastIndexOf(",")
    const lastDot = compact.lastIndexOf(".")

    let normalized = compact

    if (lastComma !== -1 && lastDot !== -1) {
        const decimalSeparator = lastComma > lastDot ? "," : "."
        normalized =
            decimalSeparator === ","
                ? compact.replace(/\./g, "").replace(",", ".")
                : compact.replace(/,/g, "")
    } else if (lastComma !== -1) {
        const commaCount = compact.split(",").length - 1
        const fractionalLength = compact.length - lastComma - 1
        normalized =
            commaCount === 1 && fractionalLength > 0 && fractionalLength <= 2
                ? compact.replace(",", ".")
                : compact.replace(/,/g, "")
    } else if (lastDot !== -1) {
        const dotCount = compact.split(".").length - 1
        const fractionalLength = compact.length - lastDot - 1
        normalized =
            dotCount === 1 && fractionalLength > 0 && fractionalLength <= 2
                ? compact
                : compact.replace(/\./g, "")
    }

    if (!normalized) return null

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
}

export function formatVariantFilterPrice(value: number) {
    if (!Number.isFinite(value)) return ""
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value)
}

export function buildVariantFilterDefaultValues(
    priceBounds: VariantPriceBounds | null,
): CustomerPortalVariantFilterValues {
    return {
        colorIds: [],
        materialIds: [],
        minPrice: priceBounds ? formatVariantFilterPrice(priceBounds.min) : "",
        maxPrice: priceBounds ? formatVariantFilterPrice(priceBounds.max) : "",
    }
}

export function normalizeVariantPriceRange(
    values: Pick<CustomerPortalVariantFilterValues, "minPrice" | "maxPrice">,
    priceBounds: VariantPriceBounds | null,
) {
    if (!priceBounds) {
        return {
            minPrice: null,
            maxPrice: null,
        }
    }

    const parsedMin = parseVariantFilterPrice(values.minPrice)
    const parsedMax = parseVariantFilterPrice(values.maxPrice)
    const nextMin = clampPrice(parsedMin ?? priceBounds.min, priceBounds.min, priceBounds.max)
    const nextMax = clampPrice(parsedMax ?? priceBounds.max, priceBounds.min, priceBounds.max)

    return {
        minPrice: Math.min(nextMin, nextMax),
        maxPrice: Math.max(nextMin, nextMax),
    }
}

export function countActiveVariantFilters(
    filters: AppliedVariantFilters,
    priceBounds: VariantPriceBounds | null,
) {
    let count = filters.colorIds.length + filters.materialIds.length

    if (
        priceBounds &&
        filters.minPrice !== null &&
        filters.maxPrice !== null &&
        (Math.abs(filters.minPrice - priceBounds.min) > 0.009 ||
            Math.abs(filters.maxPrice - priceBounds.max) > 0.009)
    ) {
        count += 1
    }

    return count
}

function clampPrice(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}
