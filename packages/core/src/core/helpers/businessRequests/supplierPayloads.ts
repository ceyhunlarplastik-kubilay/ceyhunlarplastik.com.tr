import { resolveProductVariantSupplierPricing } from "@/core/helpers/pricing/productVariantSupplier"

type SupplierProfileInput = {
    name?: unknown
    contactName?: unknown
    phone?: unknown
    address?: unknown
    taxNumber?: unknown
    defaultPaymentTermDays?: unknown
}

type SupplierSnapshot = {
    name?: string | null
    contactName?: string | null
    phone?: string | null
    address?: string | null
    taxNumber?: string | null
    defaultPaymentTermDays?: number | null
}

type VariantPricingInput = {
    price?: unknown
    operationalCostRate?: unknown
    netCost?: unknown
    profitRate?: unknown
    listPrice?: unknown
    paymentTermDays?: unknown
    supplierVariantCode?: unknown
    supplierNote?: unknown
    minOrderQty?: unknown
    stockQty?: unknown
    currency?: unknown
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value)
}

function normalizeString(value: unknown) {
    return typeof value === "string" ? value.trim() : undefined
}

export function normalizeSupplierProfileApprovalPayload(input: SupplierProfileInput) {
    return {
        ...(normalizeString(input.name) ? { name: normalizeString(input.name) } : {}),
        ...(normalizeString(input.contactName) ? { contactName: normalizeString(input.contactName) } : {}),
        ...(normalizeString(input.phone) ? { phone: normalizeString(input.phone) } : {}),
        ...(normalizeString(input.address) ? { address: normalizeString(input.address) } : {}),
        ...(normalizeString(input.taxNumber) ? { taxNumber: normalizeString(input.taxNumber) } : {}),
        ...(isFiniteNumber(input.defaultPaymentTermDays)
            ? { defaultPaymentTermDays: input.defaultPaymentTermDays }
            : {}),
    }
}

export function snapshotSupplierProfile(input: SupplierSnapshot) {
    return {
        name: input.name ?? null,
        contactName: input.contactName ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        taxNumber: input.taxNumber ?? null,
        defaultPaymentTermDays: input.defaultPaymentTermDays ?? null,
    }
}

export function normalizeSupplierVariantPricingApprovalPayload(input: VariantPricingInput) {
    return {
        ...(isFiniteNumber(input.price) ? { price: input.price } : {}),
        ...(isFiniteNumber(input.operationalCostRate) ? { operationalCostRate: input.operationalCostRate } : {}),
        ...(isFiniteNumber(input.netCost) ? { netCost: input.netCost } : {}),
        ...(isFiniteNumber(input.profitRate) ? { profitRate: input.profitRate } : {}),
        ...(isFiniteNumber(input.listPrice) ? { listPrice: input.listPrice } : {}),
        ...(isFiniteNumber(input.paymentTermDays) ? { paymentTermDays: input.paymentTermDays } : {}),
        ...(normalizeString(input.supplierVariantCode) ? { supplierVariantCode: normalizeString(input.supplierVariantCode) } : {}),
        ...(normalizeString(input.supplierNote) ? { supplierNote: normalizeString(input.supplierNote) } : {}),
        ...(isFiniteNumber(input.minOrderQty) ? { minOrderQty: input.minOrderQty } : {}),
        ...(isFiniteNumber(input.stockQty) ? { stockQty: input.stockQty } : {}),
        ...(normalizeString(input.currency) ? { currency: normalizeString(input.currency)?.toUpperCase() } : {}),
    }
}

export function snapshotSupplierVariantPricing(input: {
    price?: unknown
    operationalCostRate?: unknown
    netCost?: unknown
    profitRate?: unknown
    listPrice?: unknown
    paymentTermDays?: number | null
    supplierVariantCode?: string | null
    supplierNote?: string | null
    minOrderQty?: number | null
    stockQty?: number | null
    currency?: string | null
}) {
    return {
        price: input.price ?? null,
        operationalCostRate: input.operationalCostRate ?? null,
        netCost: input.netCost ?? null,
        profitRate: input.profitRate ?? null,
        listPrice: input.listPrice ?? null,
        paymentTermDays: input.paymentTermDays ?? null,
        supplierVariantCode: input.supplierVariantCode ?? null,
        supplierNote: input.supplierNote ?? null,
        minOrderQty: input.minOrderQty ?? null,
        stockQty: input.stockQty ?? null,
        currency: input.currency ?? null,
    }
}

export function buildApprovedVariantPricingUpdate(
    existing: {
        operationalCostRate?: unknown
        profitRate?: unknown
    },
    input: {
        price?: number
        operationalCostRate?: number
        netCost?: number
        profitRate?: number
        listPrice?: number
        paymentTermDays?: number
        supplierVariantCode?: string
        supplierNote?: string
        minOrderQty?: number
        stockQty?: number
        currency?: string
    },
) {
    return {
        ...resolveProductVariantSupplierPricing(input, {
            operationalCostRate: existing.operationalCostRate,
            profitRate: existing.profitRate,
        }),
        ...(input.paymentTermDays !== undefined ? { paymentTermDays: input.paymentTermDays } : {}),
        ...(input.supplierVariantCode !== undefined ? { supplierVariantCode: input.supplierVariantCode.trim() || null } : {}),
        ...(input.supplierNote !== undefined ? { supplierNote: input.supplierNote.trim() || null } : {}),
        ...(input.minOrderQty !== undefined ? { minOrderQty: input.minOrderQty } : {}),
        ...(input.stockQty !== undefined ? { stockQty: input.stockQty } : {}),
        ...(input.currency !== undefined ? { currency: input.currency.trim().toUpperCase() || "TRY" } : {}),
        ...((input.minOrderQty !== undefined || input.stockQty !== undefined)
            ? { availabilityUpdatedAt: new Date() }
            : {}),
    }
}
