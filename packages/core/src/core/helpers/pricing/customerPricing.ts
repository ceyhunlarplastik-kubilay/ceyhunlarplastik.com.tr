import { decimalLikeToNumber } from "./productVariantSupplier"

type DecimalLike = number | string | { toNumber?: () => number } | null | undefined

type ResolvedCustomerPricing = {
    listUnitPrice: number
    customerUnitPrice: number
    appliedDiscountPercent: number
}

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export function normalizeCustomerDiscountPercent(value: DecimalLike): number | null {
    const parsed = decimalLikeToNumber(value)
    if (parsed === undefined || !Number.isFinite(parsed)) return null

    return Math.max(0, Math.min(100, roundMoney(parsed)))
}

export function resolveCustomerDiscountedUnitPrice(
    listUnitPrice: DecimalLike,
    discountPercent: DecimalLike,
): ResolvedCustomerPricing | null {
    const listPrice = decimalLikeToNumber(listUnitPrice)
    if (listPrice === undefined || !Number.isFinite(listPrice)) return null

    const normalizedDiscount = normalizeCustomerDiscountPercent(discountPercent) ?? 0
    const customerUnitPrice = roundMoney(listPrice * (1 - normalizedDiscount / 100))

    return {
        listUnitPrice: roundMoney(listPrice),
        customerUnitPrice,
        appliedDiscountPercent: normalizedDiscount,
    }
}
