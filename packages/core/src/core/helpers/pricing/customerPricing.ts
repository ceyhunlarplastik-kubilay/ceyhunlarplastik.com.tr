import { decimalLikeToNumber } from "./productVariantSupplier"
import {
    normalizeCustomerVariantPaymentSchedule,
    type CustomerVariantPaymentScheduleStep,
} from "./customerPaymentSchedule"

type DecimalLike = number | string | { toNumber?: () => number } | null | undefined

export type CustomerVariantPriceSource =
    | "CUSTOMER_SPECIAL_PRICE"
    | "CUSTOMER_GENERAL_DISCOUNT"
    | "LIST_PRICE"

export type CustomerVariantPriceIneligibilityReason =
    | "SPECIAL_PRICE_INACTIVE"
    | "SPECIAL_PRICE_NOT_YET_VALID"
    | "SPECIAL_PRICE_EXPIRED"
    | "MIN_ORDER_QUANTITY_NOT_MET"
    | "MAX_ORDER_QUANTITY_EXCEEDED"

export type CustomerVariantSpecialPriceLike = {
    id: string
    price: DecimalLike
    currency?: string | null
    minOrderQuantity?: number | null
    maxOrderQuantity?: number | null
    paymentTermDays?: number | null
    paymentTermLabel?: string | null
    paymentSchedule?: unknown | null
    validFrom?: Date | string | null
    validUntil?: Date | string | null
    taxIncluded?: boolean | null
    deliveryTerm?: string | null
    contractReference?: string | null
    note?: string | null
    isActive?: boolean | null
}

type VariantSupplierPriceLike = {
    listPrice?: DecimalLike
    currency?: string | null
    pricingUpdatedAt?: Date | string | null
    updatedAt?: Date | string | null
}

export type CustomerVariantPriceVariantLike = {
    variantSuppliers?: VariantSupplierPriceLike[] | null
}

type ResolvedCustomerPricing = {
    listUnitPrice: number
    customerUnitPrice: number
    appliedDiscountPercent: number
}

export type ResolvedCustomerVariantPrice = {
    listPrice: number | null
    finalPrice: number | null
    currency: string
    priceSource: CustomerVariantPriceSource
    appliedDiscountPercent: number
    specialPriceId: string | null
    minOrderQuantity: number | null
    maxOrderQuantity: number | null
    paymentTermDays: number | null
    paymentTermLabel: string | null
    paymentSchedule: CustomerVariantPaymentScheduleStep[] | null
    validFrom: Date | string | null
    validUntil: Date | string | null
    taxIncluded: boolean
    deliveryTerm: string | null
    contractReference: string | null
    note: string | null
    specialPriceApplied: boolean
    specialPriceEligible: boolean | null
    ineligibilityReason: CustomerVariantPriceIneligibilityReason | null
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

function normalizeQuantity(value: number | null | undefined) {
    if (value === null || value === undefined) return null
    if (!Number.isFinite(value) || value <= 0) return null
    return Math.max(1, Math.round(value))
}

function normalizeDate(value: Date | string | null | undefined) {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolveListPrice(variant: CustomerVariantPriceVariantLike) {
    const priced = (variant.variantSuppliers ?? [])
        .map((supplier) => {
            const value = decimalLikeToNumber(supplier.listPrice)
            return value !== undefined && Number.isFinite(value)
                ? {
                    value: roundMoney(value),
                    currency: supplier.currency?.trim() || "TRY",
                }
                : null
        })
        .filter((item): item is { value: number; currency: string } => Boolean(item))

    if (priced.length === 0) return null

    return priced.reduce((lowest, current) => current.value < lowest.value ? current : lowest)
}

function getSpecialPriceIneligibility(
    specialPrice: CustomerVariantSpecialPriceLike,
    quantity: number | null,
    now: Date,
): CustomerVariantPriceIneligibilityReason | null {
    if (specialPrice.isActive === false) return "SPECIAL_PRICE_INACTIVE"

    const validFrom = normalizeDate(specialPrice.validFrom)
    if (validFrom && validFrom.getTime() > now.getTime()) return "SPECIAL_PRICE_NOT_YET_VALID"

    const validUntil = normalizeDate(specialPrice.validUntil)
    if (validUntil && validUntil.getTime() < now.getTime()) return "SPECIAL_PRICE_EXPIRED"

    if (quantity !== null) {
        if (specialPrice.minOrderQuantity && quantity < specialPrice.minOrderQuantity) {
            return "MIN_ORDER_QUANTITY_NOT_MET"
        }

        if (specialPrice.maxOrderQuantity && quantity > specialPrice.maxOrderQuantity) {
            return "MAX_ORDER_QUANTITY_EXCEEDED"
        }
    }

    return null
}

export function resolveCustomerVariantPrice(input: {
    customer: {
        generalDiscountPercent?: DecimalLike
    }
    variant: CustomerVariantPriceVariantLike
    specialPrice?: CustomerVariantSpecialPriceLike | null
    quantity?: number | null
    now?: Date
}): ResolvedCustomerVariantPrice {
    const list = resolveListPrice(input.variant)
    const listPrice = list?.value ?? null
    const defaultCurrency = list?.currency ?? input.specialPrice?.currency?.trim() ?? "TRY"
    const quantity = normalizeQuantity(input.quantity)
    const now = input.now ?? new Date()
    const specialPrice = input.specialPrice ?? null
    const ineligibilityReason = specialPrice
        ? getSpecialPriceIneligibility(specialPrice, quantity, now)
        : null
    const specialPriceEligible = specialPrice ? ineligibilityReason === null : null
    const parsedSpecialPrice = specialPrice ? decimalLikeToNumber(specialPrice.price) : undefined
    const paymentSchedule = specialPrice
        ? normalizeCustomerVariantPaymentSchedule(specialPrice.paymentSchedule)
        : null

    if (
        specialPrice
        && specialPriceEligible
        && parsedSpecialPrice !== undefined
        && Number.isFinite(parsedSpecialPrice)
    ) {
        return {
            listPrice,
            finalPrice: roundMoney(parsedSpecialPrice),
            currency: specialPrice.currency?.trim() || defaultCurrency,
            priceSource: "CUSTOMER_SPECIAL_PRICE",
            appliedDiscountPercent: 0,
            specialPriceId: specialPrice.id,
            minOrderQuantity: specialPrice.minOrderQuantity ?? null,
            maxOrderQuantity: specialPrice.maxOrderQuantity ?? null,
            paymentTermDays: specialPrice.paymentTermDays ?? null,
            paymentTermLabel: specialPrice.paymentTermLabel ?? null,
            paymentSchedule,
            validFrom: specialPrice.validFrom ?? null,
            validUntil: specialPrice.validUntil ?? null,
            taxIncluded: Boolean(specialPrice.taxIncluded),
            deliveryTerm: specialPrice.deliveryTerm ?? null,
            contractReference: specialPrice.contractReference ?? null,
            note: specialPrice.note ?? null,
            specialPriceApplied: true,
            specialPriceEligible: true,
            ineligibilityReason: null,
        }
    }

    const discounted = resolveCustomerDiscountedUnitPrice(listPrice, input.customer.generalDiscountPercent)
    if (discounted && discounted.appliedDiscountPercent > 0) {
        return {
            listPrice: discounted.listUnitPrice,
            finalPrice: discounted.customerUnitPrice,
            currency: defaultCurrency,
            priceSource: "CUSTOMER_GENERAL_DISCOUNT",
            appliedDiscountPercent: discounted.appliedDiscountPercent,
            specialPriceId: specialPrice?.id ?? null,
            minOrderQuantity: specialPrice?.minOrderQuantity ?? null,
            maxOrderQuantity: specialPrice?.maxOrderQuantity ?? null,
            paymentTermDays: specialPrice?.paymentTermDays ?? null,
            paymentTermLabel: specialPrice?.paymentTermLabel ?? null,
            paymentSchedule,
            validFrom: specialPrice?.validFrom ?? null,
            validUntil: specialPrice?.validUntil ?? null,
            taxIncluded: Boolean(specialPrice?.taxIncluded),
            deliveryTerm: specialPrice?.deliveryTerm ?? null,
            contractReference: specialPrice?.contractReference ?? null,
            note: specialPrice?.note ?? null,
            specialPriceApplied: false,
            specialPriceEligible,
            ineligibilityReason,
        }
    }

    return {
        listPrice,
        finalPrice: listPrice,
        currency: defaultCurrency,
        priceSource: "LIST_PRICE",
        appliedDiscountPercent: 0,
        specialPriceId: specialPrice?.id ?? null,
        minOrderQuantity: specialPrice?.minOrderQuantity ?? null,
        maxOrderQuantity: specialPrice?.maxOrderQuantity ?? null,
        paymentTermDays: specialPrice?.paymentTermDays ?? null,
        paymentTermLabel: specialPrice?.paymentTermLabel ?? null,
        paymentSchedule,
        validFrom: specialPrice?.validFrom ?? null,
        validUntil: specialPrice?.validUntil ?? null,
        taxIncluded: Boolean(specialPrice?.taxIncluded),
        deliveryTerm: specialPrice?.deliveryTerm ?? null,
        contractReference: specialPrice?.contractReference ?? null,
        note: specialPrice?.note ?? null,
        specialPriceApplied: false,
        specialPriceEligible,
        ineligibilityReason,
    }
}
