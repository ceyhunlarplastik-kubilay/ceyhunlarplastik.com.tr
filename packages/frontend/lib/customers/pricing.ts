export type CustomerCommercialSummary = {
    generalDiscountPercent?: number | null
    defaultPaymentTermDays?: number | null
    creditLimit?: number | null
}

type ResolvedCustomerUnitPrice = {
    listUnitPrice: number
    customerUnitPrice: number
    appliedDiscountPercent: number
}

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export function normalizeDiscountPercent(value?: number | null) {
    if (value === null || value === undefined || !Number.isFinite(value)) return 0
    return Math.max(0, Math.min(100, roundMoney(value)))
}

export function resolveCustomerDiscountedPrice(
    listUnitPrice?: number | null,
    discountPercent?: number | null,
): ResolvedCustomerUnitPrice | null {
    if (listUnitPrice === null || listUnitPrice === undefined || !Number.isFinite(listUnitPrice)) return null

    const appliedDiscountPercent = normalizeDiscountPercent(discountPercent)
    const customerUnitPrice = roundMoney(listUnitPrice * (1 - appliedDiscountPercent / 100))

    return {
        listUnitPrice: roundMoney(listUnitPrice),
        customerUnitPrice,
        appliedDiscountPercent,
    }
}

export function formatMoney(value?: number | null, currency = "TRY") {
    if (value === null || value === undefined || !Number.isFinite(value)) return "-"

    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value)
    } catch {
        return `${value.toFixed(2)} ${currency}`
    }
}

export function formatDiscountBadge(value?: number | null) {
    const normalized = normalizeDiscountPercent(value)
    if (normalized <= 0) return null
    return `%${normalized.toLocaleString("tr-TR", { minimumFractionDigits: normalized % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} iskonto`
}

export function formatPaymentTermLabel(days?: number | null) {
    if (days === null || days === undefined || !Number.isFinite(days)) return null
    return `Net ${days}`
}
