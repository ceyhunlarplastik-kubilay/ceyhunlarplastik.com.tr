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

function createOrderNumber(requestId: string) {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "")
    return `SIP-${stamp}-${requestId.slice(-6).toUpperCase()}`
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
    const listSubtotal = items.reduce<number | null>((sum, item) => {
        if (sum === null || item.listLineTotal === null) {
            return item.listLineTotal === null && sum === 0 ? null : sum ?? 0
        }

        return sum + item.listLineTotal
    }, 0)
    const customerSubtotal = items.reduce<number | null>((sum, item) => {
        if (sum === null || item.customerLineTotal === null) {
            return item.customerLineTotal === null && sum === 0 ? null : sum ?? 0
        }

        return sum + item.customerLineTotal
    }, 0)

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
            currency: items[0]?.currency ?? "TRY",
            totalQuantity,
            discountPercent: discountPercent ?? null,
            listSubtotal,
            customerSubtotal,
            requestedDeliveryDate,
            paymentTermDays: request.customer.defaultPaymentTermDays ?? null,
            paymentTermNote: request.customer.paymentTermNote ?? null,
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
                approvedFromRequestAt: createdOrder.approvedFromRequestAt?.toISOString() ?? null,
            } as Prisma.InputJsonValue,
        },
    })

    return createdOrder
}
