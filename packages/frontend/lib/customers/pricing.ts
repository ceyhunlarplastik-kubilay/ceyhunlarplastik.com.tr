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

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function getStringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null
}

function getNumberValue(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function getCommercialPricingSnapshot(data?: Record<string, unknown> | null) {
    const record = asRecord(data)
    const nestedSnapshot = asRecord(record.pricingSnapshot)

    return Object.keys(nestedSnapshot).length > 0 ? nestedSnapshot : record
}

export function formatCommercialPriceSource(
    data?: Record<string, unknown> | null,
    explicitPriceSource?: string | null,
) {
    const snapshot = getCommercialPricingSnapshot(data)
    const priceSource = explicitPriceSource?.trim()
        || getStringValue(data?.priceSource)
        || getStringValue(snapshot.priceSource)

    if (priceSource === "CUSTOMER_SPECIAL_PRICE") return "Özel fiyat"
    if (priceSource === "CUSTOMER_GENERAL_DISCOUNT") return "Genel iskonto"
    return "Liste fiyatı"
}

export function formatCommercialPaymentTerm(
    data?: Record<string, unknown> | null,
    fallbackDays?: number | null,
    emptyLabel = "Varsayılan vade",
) {
    const snapshot = getCommercialPricingSnapshot(data)
    const paymentSchedule = Array.isArray(snapshot.paymentSchedule) ? snapshot.paymentSchedule : []
    const paymentTermLabel = getStringValue(snapshot.paymentTermLabel)
    const paymentTermDays = getNumberValue(snapshot.paymentTermDays)

    if (paymentSchedule.length > 0) return "Çok aşamalı vade"
    if (paymentTermLabel) return paymentTermLabel
    if (paymentTermDays !== null) return formatPaymentTermLabel(paymentTermDays) ?? `${paymentTermDays} gün`
    return formatPaymentTermLabel(fallbackDays) ?? emptyLabel
}

export function formatCommercialTaxStatus(data?: Record<string, unknown> | null) {
    const snapshot = getCommercialPricingSnapshot(data)
    return snapshot.taxIncluded === true ? "KDV dahil" : "KDV hariç"
}
