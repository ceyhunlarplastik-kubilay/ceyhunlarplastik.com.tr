export type PortalDraftPriceSource = "CUSTOMER_SPECIAL_PRICE" | "CUSTOMER_GENERAL_DISCOUNT" | "LIST_PRICE"

export type PortalDraftSpecialPriceIneligibilityReason =
    | "SPECIAL_PRICE_INACTIVE"
    | "SPECIAL_PRICE_NOT_YET_VALID"
    | "SPECIAL_PRICE_EXPIRED"
    | "MIN_ORDER_QUANTITY_NOT_MET"
    | "MAX_ORDER_QUANTITY_EXCEEDED"
    | "SPECIAL_PRICE_MISSING_PRICE"

export type PortalDraftPaymentScheduleStep = {
    percentage: number
    paymentTermDays: number
    label: string
    note?: string | null
}

export type PortalDraftSpecialPricePreview = {
    id: string
    price: number | null
    currency: string
    minOrderQuantity?: number | null
    maxOrderQuantity?: number | null
    paymentTermDays?: number | null
    paymentTermLabel?: string | null
    paymentSchedule?: PortalDraftPaymentScheduleStep[] | null
    validFrom?: string | null
    validUntil?: string | null
    taxIncluded?: boolean | null
    deliveryTerm?: string | null
    contractReference?: string | null
    note?: string | null
    isActive?: boolean | null
}

type PortalDraftSpecialPricePreviewSource = {
    id: string
    price?: number | null
    currency?: string | null
    minOrderQuantity?: number | null
    maxOrderQuantity?: number | null
    paymentTermDays?: number | null
    paymentTermLabel?: string | null
    paymentSchedule?: PortalDraftPaymentScheduleStep[] | null
    validFrom?: string | null
    validUntil?: string | null
    taxIncluded?: boolean | null
    deliveryTerm?: string | null
    contractReference?: string | null
    note?: string | null
    isActive?: boolean | null
    pricing?: {
        finalPrice?: number | null
        currency?: string | null
    } | null
}

export type ResolvedPortalDraftPricing = {
    listUnitPrice: number | null
    customerUnitPrice: number | null
    appliedDiscountPercent: number
    currency: string
    priceSource: PortalDraftPriceSource
    specialPriceId: string | null
    specialPriceApplied: boolean
    specialPriceEligible: boolean | null
    specialPriceIneligibilityReason: PortalDraftSpecialPriceIneligibilityReason | null
    specialPriceIneligibilityMessage: string | null
    pricingSnapshot: Record<string, unknown>
}

type PortalDraftCommercialTermItem = {
    variantId: string
    variantFullCode: string
    productName: string
    currency?: string | null
    priceSource?: PortalDraftPriceSource | null
    pricingSnapshot?: Record<string, unknown> | null
}

export type PortalDraftCommercialTermGroup = {
    key: string
    label: string
    items: PortalDraftCommercialTermItem[]
}

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function toFiniteNumber(value: number | null | undefined) {
    return value !== null && value !== undefined && Number.isFinite(value) ? value : null
}

function normalizeDiscountPercent(value?: number | null) {
    const parsed = toFiniteNumber(value)
    if (parsed === null) return 0
    return Math.max(0, Math.min(100, roundMoney(parsed)))
}

function normalizeQuantity(value?: number | null) {
    if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null
    return Math.max(1, Math.round(value))
}

function normalizeDate(value?: string | null) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function resolveSpecialPriceIneligibility(
    specialPrice: PortalDraftSpecialPricePreview,
    quantity?: number | null,
): PortalDraftSpecialPriceIneligibilityReason | null {
    if (specialPrice.isActive === false) return "SPECIAL_PRICE_INACTIVE"
    if (toFiniteNumber(specialPrice.price) === null) return "SPECIAL_PRICE_MISSING_PRICE"

    const now = new Date()
    const validFrom = normalizeDate(specialPrice.validFrom)
    if (validFrom && validFrom.getTime() > now.getTime()) return "SPECIAL_PRICE_NOT_YET_VALID"

    const validUntil = normalizeDate(specialPrice.validUntil)
    if (validUntil && validUntil.getTime() < now.getTime()) return "SPECIAL_PRICE_EXPIRED"

    const normalizedQuantity = normalizeQuantity(quantity)
    if (normalizedQuantity !== null) {
        if (specialPrice.minOrderQuantity && normalizedQuantity < specialPrice.minOrderQuantity) {
            return "MIN_ORDER_QUANTITY_NOT_MET"
        }

        if (specialPrice.maxOrderQuantity && normalizedQuantity > specialPrice.maxOrderQuantity) {
            return "MAX_ORDER_QUANTITY_EXCEEDED"
        }
    }

    return null
}

export function formatPortalDraftSpecialPriceIneligibility(
    reason: PortalDraftSpecialPriceIneligibilityReason | null,
    specialPrice?: PortalDraftSpecialPricePreview | null,
) {
    if (!reason) return null

    if (reason === "MIN_ORDER_QUANTITY_NOT_MET" && specialPrice?.minOrderQuantity) {
        return `Özel fiyat için minimum ${specialPrice.minOrderQuantity} adet gerekli.`
    }

    if (reason === "MAX_ORDER_QUANTITY_EXCEEDED" && specialPrice?.maxOrderQuantity) {
        return `Özel fiyat maksimum ${specialPrice.maxOrderQuantity} adet için geçerlidir.`
    }

    if (reason === "SPECIAL_PRICE_EXPIRED") return "Özel fiyatın geçerlilik süresi dolmuş."
    if (reason === "SPECIAL_PRICE_NOT_YET_VALID") return "Özel fiyat henüz geçerli değil."
    if (reason === "SPECIAL_PRICE_INACTIVE") return "Özel fiyat şu anda aktif değil."
    if (reason === "SPECIAL_PRICE_MISSING_PRICE") return "Özel fiyat tutarı eksik."

    return "Özel fiyat koşulları şu anda sağlanmıyor."
}

export function mapSpecialPriceToPortalDraftPreview(
    specialPrice?: PortalDraftSpecialPricePreviewSource | null,
): PortalDraftSpecialPricePreview | null {
    if (!specialPrice) return null

    return {
        id: specialPrice.id,
        price: toFiniteNumber(specialPrice.price) ?? toFiniteNumber(specialPrice.pricing?.finalPrice),
        currency: specialPrice.currency?.trim() || specialPrice.pricing?.currency?.trim() || "TRY",
        minOrderQuantity: specialPrice.minOrderQuantity ?? null,
        maxOrderQuantity: specialPrice.maxOrderQuantity ?? null,
        paymentTermDays: specialPrice.paymentTermDays ?? null,
        paymentTermLabel: specialPrice.paymentTermLabel ?? null,
        paymentSchedule: specialPrice.paymentSchedule ?? null,
        validFrom: specialPrice.validFrom ?? null,
        validUntil: specialPrice.validUntil ?? null,
        taxIncluded: specialPrice.taxIncluded ?? false,
        deliveryTerm: specialPrice.deliveryTerm ?? null,
        contractReference: specialPrice.contractReference ?? null,
        note: specialPrice.note ?? null,
        isActive: specialPrice.isActive ?? true,
    }
}

export function resolvePortalDraftPricing(input: {
    quantity?: number | null
    listUnitPrice?: number | null
    currency?: string | null
    generalDiscountPercent?: number | null
    specialPrice?: PortalDraftSpecialPricePreview | null
}): ResolvedPortalDraftPricing {
    const listUnitPrice = toFiniteNumber(input.listUnitPrice)
    const specialPrice = input.specialPrice ?? null
    const currency = input.currency?.trim() || specialPrice?.currency?.trim() || "TRY"
    const ineligibilityReason = specialPrice
        ? resolveSpecialPriceIneligibility(specialPrice, input.quantity)
        : null
    const specialPriceEligible = specialPrice ? ineligibilityReason === null : null
    const specialPriceValue = specialPrice ? toFiniteNumber(specialPrice.price) : null

    let customerUnitPrice = listUnitPrice
    let appliedDiscountPercent = 0
    let priceSource: PortalDraftPriceSource = "LIST_PRICE"
    let specialPriceApplied = false

    if (specialPrice && specialPriceEligible && specialPriceValue !== null) {
        customerUnitPrice = roundMoney(specialPriceValue)
        priceSource = "CUSTOMER_SPECIAL_PRICE"
        specialPriceApplied = true
    } else if (listUnitPrice !== null) {
        appliedDiscountPercent = normalizeDiscountPercent(input.generalDiscountPercent)
        if (appliedDiscountPercent > 0) {
            customerUnitPrice = roundMoney(listUnitPrice * (1 - appliedDiscountPercent / 100))
            priceSource = "CUSTOMER_GENERAL_DISCOUNT"
        }
    }

    const pricingSnapshot = {
        specialPriceId: specialPrice?.id ?? null,
        priceSource,
        unitPrice: customerUnitPrice,
        listPrice: listUnitPrice,
        currency,
        minOrderQuantity: specialPrice?.minOrderQuantity ?? null,
        maxOrderQuantity: specialPrice?.maxOrderQuantity ?? null,
        paymentTermDays: specialPrice?.paymentTermDays ?? null,
        paymentTermLabel: specialPrice?.paymentTermLabel ?? null,
        paymentSchedule: specialPrice?.paymentSchedule ?? null,
        taxIncluded: Boolean(specialPrice?.taxIncluded),
        validFrom: specialPrice?.validFrom ?? null,
        validUntil: specialPrice?.validUntil ?? null,
        deliveryTerm: specialPrice?.deliveryTerm ?? null,
        contractReference: specialPrice?.contractReference ?? null,
        specialPriceApplied,
        specialPriceEligible,
        ineligibilityReason,
    }

    return {
        listUnitPrice,
        customerUnitPrice,
        appliedDiscountPercent,
        currency,
        priceSource,
        specialPriceId: specialPrice?.id ?? null,
        specialPriceApplied,
        specialPriceEligible,
        specialPriceIneligibilityReason: ineligibilityReason,
        specialPriceIneligibilityMessage: formatPortalDraftSpecialPriceIneligibility(ineligibilityReason, specialPrice),
        pricingSnapshot,
    }
}

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function stringValue(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function termValue(value: unknown, fallback: string) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
    if (typeof value === "string" && value.trim()) return value.trim()
    return fallback
}

function buildCommercialTermDescriptor(item: PortalDraftCommercialTermItem) {
    const snapshot = asRecord(item.pricingSnapshot)
    const priceSource = item.priceSource ?? stringValue(snapshot.priceSource, "LIST_PRICE")
    const currency = item.currency?.trim() || stringValue(snapshot.currency, "TRY")
    const paymentTermDays = termValue(snapshot.paymentTermDays, "default")
    const paymentTermLabel = termValue(snapshot.paymentTermLabel, "default")
    const paymentSchedule = Array.isArray(snapshot.paymentSchedule)
        ? JSON.stringify(snapshot.paymentSchedule)
        : "none"
    const taxIncluded = snapshot.taxIncluded === true ? "tax-included" : "tax-excluded"
    const deliveryTerm = stringValue(snapshot.deliveryTerm, "default")
    const contractReference = stringValue(snapshot.contractReference, "default")

    return {
        priceSource,
        currency,
        paymentTermDays,
        paymentTermLabel,
        paymentSchedule,
        taxIncluded,
        deliveryTerm,
        contractReference,
        key: [
            priceSource,
            currency,
            paymentTermDays,
            paymentTermLabel,
            paymentSchedule,
            taxIncluded,
            deliveryTerm,
            contractReference,
        ].join("::"),
    }
}

export function buildPortalDraftCommercialTermGroups(items: PortalDraftCommercialTermItem[]) {
    const groups = new Map<string, PortalDraftCommercialTermGroup>()

    for (const item of items) {
        const descriptor = buildCommercialTermDescriptor(item)
        const sourceLabel = descriptor.priceSource === "CUSTOMER_SPECIAL_PRICE"
            ? "Özel fiyat"
            : descriptor.priceSource === "CUSTOMER_GENERAL_DISCOUNT"
                ? "Genel iskonto"
                : "Liste fiyatı"
        const paymentLabel = descriptor.paymentTermLabel !== "default"
            ? descriptor.paymentTermLabel
            : descriptor.paymentTermDays !== "default"
                ? `${descriptor.paymentTermDays} Gün`
                : "Varsayılan vade"
        const taxLabel = descriptor.taxIncluded === "tax-included" ? "KDV dahil" : "KDV hariç"
        const contractLabel = descriptor.contractReference !== "default"
            ? ` / ${descriptor.contractReference}`
            : ""

        const current = groups.get(descriptor.key) ?? {
            key: descriptor.key,
            label: `${sourceLabel} / ${descriptor.currency} / ${paymentLabel} / ${taxLabel}${contractLabel}`,
            items: [],
        }

        current.items.push(item)
        groups.set(descriptor.key, current)
    }

    return Array.from(groups.values())
}
