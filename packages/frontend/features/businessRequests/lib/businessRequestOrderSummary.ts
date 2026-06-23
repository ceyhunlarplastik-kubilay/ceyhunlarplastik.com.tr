import type { BusinessRequest } from "@/features/businessRequests/api/types"
import {
    formatCommercialPaymentTerm,
    formatCommercialPriceSource,
    formatCommercialTaxStatus,
    getCommercialPricingSnapshot,
} from "@/lib/customers/pricing"

export type BusinessRequestOrderItem = NonNullable<BusinessRequest["items"]>[number]

export type BusinessRequestOrderCurrencySummary = {
    currency: string
    listTotal: number
    customerTotal: number
    hasListTotal: boolean
    hasCustomerTotal: boolean
}

export type BusinessRequestCommercialTermGroup = {
    key: string
    paymentTermLabel: string
    currency: string
    taxStatus: string
    priceSource: string
    itemCount: number
    totalQuantity: number
}

export type BusinessRequestOrderSummaryData = {
    itemCount: number
    totalQuantity: number
    currencySummary: BusinessRequestOrderCurrencySummary[]
    commercialTermGroups: BusinessRequestCommercialTermGroup[]
    paymentTermLabels: string[]
    hasMixedCurrency: boolean
    hasMixedPaymentTerms: boolean
    hasMixedCommercialTerms: boolean
    shippingAddressLabel: string | null
    requestedDeliveryDate: string | null
    referenceCode: string | null
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

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function getItemQuantity(item: BusinessRequestOrderItem) {
    return Number.isFinite(item.quantity) ? item.quantity : 0
}

export function getBusinessRequestOrderItemCurrency(item: BusinessRequestOrderItem) {
    const data = item.data ?? {}
    const snapshot = getCommercialPricingSnapshot(data)

    return getStringValue(data.currency)
        ?? getStringValue(snapshot.currency)
        ?? "TRY"
}

function getItemPaymentTermLabel(item: BusinessRequestOrderItem) {
    return formatCommercialPaymentTerm(item.data, undefined, "Vade tanımlı değil")
}

export function formatBusinessRequestOrderQuantity(value: number) {
    return value.toLocaleString("tr-TR", {
        maximumFractionDigits: 3,
    })
}

export function buildBusinessRequestOrderCurrencySummary(items: BusinessRequestOrderItem[]) {
    const summary = new Map<string, BusinessRequestOrderCurrencySummary>()

    for (const item of items) {
        const currency = getBusinessRequestOrderItemCurrency(item)
        const current = summary.get(currency) ?? {
            currency,
            listTotal: 0,
            customerTotal: 0,
            hasListTotal: false,
            hasCustomerTotal: false,
        }
        const quantity = getItemQuantity(item)
        const listUnitPrice = getNumberValue(item.data?.listUnitPrice)
        const customerUnitPrice = getNumberValue(item.data?.customerUnitPrice) ?? listUnitPrice

        if (listUnitPrice !== null) {
            current.listTotal += listUnitPrice * quantity
            current.hasListTotal = true
        }

        if (customerUnitPrice !== null) {
            current.customerTotal += customerUnitPrice * quantity
            current.hasCustomerTotal = true
        }

        summary.set(currency, current)
    }

    return Array.from(summary.values()).map((item) => ({
        ...item,
        listTotal: roundMoney(item.listTotal),
        customerTotal: roundMoney(item.customerTotal),
    }))
}

export function buildBusinessRequestCommercialTermGroups(items: BusinessRequestOrderItem[]) {
    const groups = new Map<string, BusinessRequestCommercialTermGroup>()

    for (const item of items) {
        const paymentTermLabel = getItemPaymentTermLabel(item)
        const currency = getBusinessRequestOrderItemCurrency(item)
        const taxStatus = formatCommercialTaxStatus(item.data)
        const priceSource = formatCommercialPriceSource(item.data)
        const key = [paymentTermLabel, currency, taxStatus, priceSource].join("|")
        const current = groups.get(key) ?? {
            key,
            paymentTermLabel,
            currency,
            taxStatus,
            priceSource,
            itemCount: 0,
            totalQuantity: 0,
        }

        current.itemCount += 1
        current.totalQuantity += getItemQuantity(item)
        groups.set(key, current)
    }

    return Array.from(groups.values())
}

export function getBusinessRequestOrderSummary(request: BusinessRequest): BusinessRequestOrderSummaryData | null {
    if (request.type !== "CUSTOMER_ORDER_REQUEST") return null

    const items = request.items ?? []
    if (items.length === 0) return null

    const requestedData = asRecord(request.requestedData)
    const currencySummary = buildBusinessRequestOrderCurrencySummary(items)
    const commercialTermGroups = buildBusinessRequestCommercialTermGroups(items)
    const paymentTermLabels = Array.from(
        new Set(commercialTermGroups.map((group) => group.paymentTermLabel)),
    )
    const totalQuantity = items.reduce((total, item) => total + getItemQuantity(item), 0)

    return {
        itemCount: items.length,
        totalQuantity,
        currencySummary,
        commercialTermGroups,
        paymentTermLabels,
        hasMixedCurrency: currencySummary.length > 1,
        hasMixedPaymentTerms: paymentTermLabels.length > 1,
        hasMixedCommercialTerms: commercialTermGroups.length > 1,
        shippingAddressLabel: getStringValue(requestedData.shippingAddressLabel),
        requestedDeliveryDate: getStringValue(requestedData.requestedDeliveryDate),
        referenceCode: getStringValue(requestedData.referenceCode),
    }
}
