export type DecimalLike = number | string | { toNumber?: () => number } | null | undefined

type VariantPricingInput = {
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
}

type ExistingVariantPricing = {
    operationalCostRate?: DecimalLike
    profitRate?: DecimalLike
}

type ResolvedVariantPricing = {
    price?: number
    operationalCostRate?: number
    netCost?: number
    profitRate?: number
    listPrice?: number
    pricingUpdatedAt?: Date
}

export function decimalLikeToNumber(value: DecimalLike): number | undefined {
    if (value === null || value === undefined) return undefined
    if (typeof value === "number" && Number.isFinite(value)) return value

    if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    if (typeof value === "object" && value !== null && typeof value.toNumber === "function") {
        const parsed = value.toNumber()
        return Number.isFinite(parsed) ? parsed : undefined
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function roundTo(value: number, decimals: number) {
    const factor = 10 ** decimals
    return Math.round((value + Number.EPSILON) * factor) / factor
}

export function resolveProductVariantSupplierPricing(
    input: VariantPricingInput,
    existing: ExistingVariantPricing = {}
): ResolvedVariantPricing {
    const result: ResolvedVariantPricing = {}

    const hasPrice = typeof input.price === "number" && Number.isFinite(input.price)
    const hasOperationalRate =
        typeof input.operationalCostRate === "number" && Number.isFinite(input.operationalCostRate)
    const hasNetCost = typeof input.netCost === "number" && Number.isFinite(input.netCost)
    const hasProfitRate = typeof input.profitRate === "number" && Number.isFinite(input.profitRate)
    const hasListPrice = typeof input.listPrice === "number" && Number.isFinite(input.listPrice)

    const existingOperationalRate = decimalLikeToNumber(existing.operationalCostRate) ?? 0
    const existingProfitRate = decimalLikeToNumber(existing.profitRate)

    const resolvedOperationalRate = hasOperationalRate ? input.operationalCostRate! : existingOperationalRate
    const resolvedProfitRate = hasProfitRate ? input.profitRate! : existingProfitRate

    if (hasPrice) result.price = roundTo(input.price!, 2)
    if (hasOperationalRate) result.operationalCostRate = roundTo(input.operationalCostRate!, 2)
    if (hasNetCost) result.netCost = roundTo(input.netCost!, 2)
    if (hasProfitRate) result.profitRate = roundTo(input.profitRate!, 2)
    if (hasListPrice) result.listPrice = roundTo(input.listPrice!, 2)

    const resolvedNetCost =
        hasNetCost
            ? input.netCost!
            : hasPrice
                ? input.price! * (1 + resolvedOperationalRate / 100)
                : undefined

    if (resolvedNetCost !== undefined) {
        result.netCost = roundTo(resolvedNetCost, 2)
    }

    if (resolvedNetCost !== undefined) {
        if (hasProfitRate) {
            result.profitRate = roundTo(input.profitRate!, 2)
            result.listPrice = roundTo(resolvedNetCost * (1 + input.profitRate! / 100), 2)
        } else if (!hasListPrice && resolvedProfitRate !== undefined) {
            result.profitRate = roundTo(resolvedProfitRate, 2)
            result.listPrice = roundTo(resolvedNetCost * (1 + resolvedProfitRate / 100), 2)
        } else if (hasListPrice && resolvedNetCost > 0) {
            result.listPrice = roundTo(input.listPrice!, 2)
            result.profitRate = roundTo(((input.listPrice! - resolvedNetCost) / resolvedNetCost) * 100, 2)
        }
    }

    if (hasPrice || hasOperationalRate || hasNetCost || hasProfitRate || hasListPrice) {
        result.pricingUpdatedAt = new Date()
    }

    return result
}
