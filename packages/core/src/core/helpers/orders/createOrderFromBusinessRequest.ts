import createError from "http-errors"

import type { prisma } from "@/core/db/prisma"
import { normalizeCustomerDiscountPercent } from "@/core/helpers/pricing/customerPricing"
import type { BusinessRequestWithRelations } from "@/core/helpers/prisma/businessRequests/repository"
import type { Prisma } from "@/prisma/generated/prisma/client"

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

function asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

function toFiniteNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

function toPositiveInt(value: unknown, fallback = 1) {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.max(1, Math.round(value))
        : fallback
}

function toNullableString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null
}

function toNullableDate(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return null

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function createOrderNumber(requestId: string) {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "")
    return `SIP-${stamp}-${requestId.slice(-6).toUpperCase()}`
}

function getPricingSnapshot(data: Record<string, unknown>) {
    return asRecord(data.pricingSnapshot)
}

function getStringValue(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function getCommercialTermDescriptor(item: {
    currency: string
    data: Record<string, unknown>
}) {
    const snapshot = getPricingSnapshot(item.data)
    const priceSource = getStringValue(item.data.priceSource ?? snapshot.priceSource, "LIST_PRICE")
    const paymentTermDays = typeof snapshot.paymentTermDays === "number" && Number.isFinite(snapshot.paymentTermDays)
        ? String(snapshot.paymentTermDays)
        : "default"
    const paymentTermLabel = getStringValue(snapshot.paymentTermLabel, "default")
    const paymentSchedule = Array.isArray(snapshot.paymentSchedule)
        ? JSON.stringify(snapshot.paymentSchedule)
        : "none"
    const taxIncluded = snapshot.taxIncluded === true ? "tax-included" : "tax-excluded"
    const deliveryTerm = getStringValue(snapshot.deliveryTerm, "default")
    const contractReference = getStringValue(snapshot.contractReference, "default")

    return {
        priceSource,
        currency: item.currency,
        paymentTermDays,
        paymentTermLabel,
        paymentSchedule,
        taxIncluded,
        deliveryTerm,
        contractReference,
        key: [
            priceSource,
            item.currency,
            paymentTermDays,
            paymentTermLabel,
            paymentSchedule,
            taxIncluded,
            deliveryTerm,
            contractReference,
        ].join("::"),
    }
}

function getCommercialTermLabel(descriptor: ReturnType<typeof getCommercialTermDescriptor>) {
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

    return `${sourceLabel} / ${descriptor.currency} / ${paymentLabel} / ${taxLabel}${contractLabel}`
}

function buildCommercialTermGroups(items: Array<{
    productVariantId: string | null
    quantity: number
    data: Record<string, unknown>
    currency: string
}>) {
    const groups = new Map<string, {
        key: string
        label: string
        itemCount: number
        variantIds: string[]
    }>()

    for (const item of items) {
        const descriptor = getCommercialTermDescriptor(item)
        const current = groups.get(descriptor.key) ?? {
            key: descriptor.key,
            label: getCommercialTermLabel(descriptor),
            itemCount: 0,
            variantIds: [],
        }

        current.itemCount += 1
        if (item.productVariantId) current.variantIds.push(item.productVariantId)
        groups.set(descriptor.key, current)
    }

    return Array.from(groups.values())
}

function buildCurrencySubtotals(items: Array<{
    currency: string
    quantity: number
    listLineTotal: number | null
    customerLineTotal: number | null
}>) {
    const summary = new Map<string, {
        currency: string
        totalQuantity: number
        listSubtotal: number
        customerSubtotal: number
        hasEveryListTotal: boolean
        hasEveryCustomerTotal: boolean
    }>()

    for (const item of items) {
        const current = summary.get(item.currency) ?? {
            currency: item.currency,
            totalQuantity: 0,
            listSubtotal: 0,
            customerSubtotal: 0,
            hasEveryListTotal: true,
            hasEveryCustomerTotal: true,
        }

        current.totalQuantity += item.quantity

        if (item.listLineTotal === null) {
            current.hasEveryListTotal = false
        } else {
            current.listSubtotal += item.listLineTotal
        }

        if (item.customerLineTotal === null) {
            current.hasEveryCustomerTotal = false
        } else {
            current.customerSubtotal += item.customerLineTotal
        }

        summary.set(item.currency, current)
    }

    return Array.from(summary.values()).map((item) => ({
        currency: item.currency,
        totalQuantity: item.totalQuantity,
        listSubtotal: item.hasEveryListTotal ? roundMoney(item.listSubtotal) : null,
        customerSubtotal: item.hasEveryCustomerTotal ? roundMoney(item.customerSubtotal) : null,
    }))
}

function getPaymentTermLabel(data: Record<string, unknown>, fallbackDays?: number | null) {
    const snapshot = getPricingSnapshot(data)
    if (Array.isArray(snapshot.paymentSchedule) && snapshot.paymentSchedule.length > 0) {
        return "Çok aşamalı vade"
    }

    const paymentTermLabel = toNullableString(snapshot.paymentTermLabel)
    if (paymentTermLabel) return paymentTermLabel

    if (typeof snapshot.paymentTermDays === "number" && Number.isFinite(snapshot.paymentTermDays)) {
        return `Net ${snapshot.paymentTermDays}`
    }

    if (typeof fallbackDays === "number" && Number.isFinite(fallbackDays)) {
        return `Net ${fallbackDays}`
    }

    return "Vade tanımlı değil"
}

function getPaymentTermDays(data: Record<string, unknown>, fallbackDays?: number | null) {
    const snapshot = getPricingSnapshot(data)
    if (typeof snapshot.paymentTermDays === "number" && Number.isFinite(snapshot.paymentTermDays)) {
        return snapshot.paymentTermDays
    }

    return typeof fallbackDays === "number" && Number.isFinite(fallbackDays) ? fallbackDays : null
}

function resolveOrderPaymentTerms(
    items: Array<{ data: Record<string, unknown> }>,
    fallbackDays?: number | null,
    fallbackNote?: string | null,
) {
    const labels = Array.from(new Set(items.map((item) => getPaymentTermLabel(item.data, fallbackDays))))
    const days = Array.from(new Set(items.map((item) => getPaymentTermDays(item.data, fallbackDays)).map((value) => value ?? "none")))
    const hasMixedPaymentTerms = labels.length > 1 || days.length > 1
    const noteParts = [
        hasMixedPaymentTerms ? `Kalem bazında farklı ödeme koşulları var: ${labels.join(", ")}.` : null,
        fallbackNote?.trim() || null,
    ].filter((value): value is string => Boolean(value))

    return {
        hasMixedPaymentTerms,
        paymentTermDays: !hasMixedPaymentTerms && days.length === 1 && typeof days[0] === "number"
            ? days[0]
            : null,
        paymentTermNote: noteParts.length > 0 ? noteParts.join("\n") : null,
        paymentTermLabels: labels,
    }
}

export async function createOrderFromApprovedCustomerRequestTx(
    tx: PrismaTransactionClient,
    request: BusinessRequestWithRelations,
) {
    if (!request.customerId || !request.customer) {
        throw new createError.BadRequest("Customer order request is missing its customer target")
    }

    const requestedData = asRecord(request.requestedData)
    const shippingAddressId = toNullableString(requestedData.shippingAddressId)
    const requestedDeliveryDate = toNullableDate(requestedData.requestedDeliveryDate)
    const discountPercent = normalizeCustomerDiscountPercent(request.customer.generalDiscountPercent)

    const items = (request.items ?? []).map((item, index) => {
        const data = asRecord(item.data)
        const quantity = toPositiveInt(item.quantity, 1)
        const listUnitPrice = toFiniteNumber(data.listUnitPrice)
        const customerUnitPrice = toFiniteNumber(data.customerUnitPrice) ?? listUnitPrice
        const currency = toNullableString(data.currency) ?? "TRY"

        return {
            productVariantId: item.productVariantId ?? null,
            quantity,
            note: item.note?.trim() || null,
            data,
            displayOrder: index,
            listUnitPrice,
            customerUnitPrice,
            currency,
            listLineTotal: listUnitPrice !== null ? listUnitPrice * quantity : null,
            customerLineTotal: customerUnitPrice !== null ? customerUnitPrice * quantity : null,
        }
    })

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const currencySubtotals = buildCurrencySubtotals(items)
    const hasMixedCurrency = currencySubtotals.length > 1
    const listSubtotal = hasMixedCurrency ? null : currencySubtotals[0]?.listSubtotal ?? null
    const customerSubtotal = hasMixedCurrency ? null : currencySubtotals[0]?.customerSubtotal ?? null
    const commercialTermGroups = buildCommercialTermGroups(items)
    const paymentTerms = resolveOrderPaymentTerms(
        items,
        request.customer.defaultPaymentTermDays ?? null,
        request.customer.paymentTermNote ?? null,
    )

    const shippingAddressSnapshot = shippingAddressId
        ? await tx.customerAddress.findUnique({
            where: { id: shippingAddressId },
        })
        : requestedData.shippingAddressDraft ?? null

    const createdOrder = await tx.order.create({
        data: {
            orderNumber: createOrderNumber(request.id),
            status: "APPROVED",
            title: request.title,
            customer: {
                connect: { id: request.customerId },
            },
            ...(request.requestedByUserId
                ? {
                    requestedByUser: {
                        connect: { id: request.requestedByUserId },
                    },
                }
                : {}),
            sourceRequest: {
                connect: { id: request.id },
            },
            ...(shippingAddressId
                ? {
                    shippingAddress: {
                        connect: { id: shippingAddressId },
                    },
                }
                : {}),
            shippingAddressLabel: toNullableString(requestedData.shippingAddressLabel),
            shippingAddressSnapshot: shippingAddressSnapshot as Prisma.InputJsonValue,
            referenceCode: toNullableString(requestedData.referenceCode),
            currency: hasMixedCurrency ? "MIXED" : currencySubtotals[0]?.currency ?? items[0]?.currency ?? "TRY",
            totalQuantity,
            discountPercent: discountPercent ?? null,
            listSubtotal,
            customerSubtotal,
            requestedDeliveryDate,
            paymentTermDays: paymentTerms.paymentTermDays,
            paymentTermNote: paymentTerms.paymentTermNote,
            commercialNote: toNullableString(requestedData.commercialNote),
            negotiationNote: toNullableString(requestedData.negotiationNote),
            approvedFromRequestAt: new Date(),
            items: {
                create: items.map((item) => ({
                    ...(item.productVariantId
                        ? {
                            productVariant: {
                                connect: { id: item.productVariantId },
                            },
                        }
                        : {}),
                    quantity: item.quantity,
                    note: item.note,
                    data: item.data as Prisma.InputJsonValue,
                    displayOrder: item.displayOrder,
                    listUnitPrice: item.listUnitPrice,
                    customerUnitPrice: item.customerUnitPrice,
                    listLineTotal: item.listLineTotal,
                    customerLineTotal: item.customerLineTotal,
                    currency: item.currency,
                })),
            },
        },
    })

    await tx.businessRequest.update({
        where: { id: request.id },
        data: {
            completedSnapshot: {
                orderId: createdOrder.id,
                orderNumber: createdOrder.orderNumber,
                totalQuantity,
                listSubtotal,
                customerSubtotal,
                currency: hasMixedCurrency ? "MIXED" : currencySubtotals[0]?.currency ?? items[0]?.currency ?? "TRY",
                currencySubtotals,
                commercialTermGroups,
                hasMixedCurrency,
                hasMixedPaymentTerms: paymentTerms.hasMixedPaymentTerms,
                paymentTermLabels: paymentTerms.paymentTermLabels,
                approvedFromRequestAt: createdOrder.approvedFromRequestAt?.toISOString() ?? null,
            } as Prisma.InputJsonValue,
        },
    })

    return createdOrder
}
