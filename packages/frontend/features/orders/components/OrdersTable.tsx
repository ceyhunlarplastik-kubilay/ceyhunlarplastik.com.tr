"use client"

import { Package2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge"
import type { Order } from "@/features/orders/api/types"
import { formatCommercialPaymentTerm, formatMoney, formatPaymentTermLabel } from "@/lib/customers/pricing"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    orders: Order[]
    isLoading?: boolean
    emptyMessage: string
    showCustomer?: boolean
}

function formatDate(value?: string | null) {
    if (!value) return "-"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

function getStringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null
}

function getNumberValue(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

function getItemPaymentTermLabel(item: NonNullable<Order["items"]>[number], fallbackDays?: number | null) {
    return formatCommercialPaymentTerm(item.data, fallbackDays, "Vade tanımlı değil")
}

function getOrderPaymentTermLabels(order: Order) {
    const labels = new Set<string>()

    for (const item of order.items ?? []) {
        labels.add(getItemPaymentTermLabel(item, order.paymentTermDays))
    }

    if (labels.size === 0) labels.add(formatPaymentTermLabel(order.paymentTermDays) ?? "Vade tanımlı değil")

    return Array.from(labels)
}

function buildOrderCurrencySummary(order: Order) {
    const summary = new Map<string, { currency: string; listTotal: number; customerTotal: number }>()

    for (const item of order.items ?? []) {
        const currency = item.currency || getStringValue(item.data?.currency) || order.currency || "TRY"
        const current = summary.get(currency) ?? {
            currency,
            listTotal: 0,
            customerTotal: 0,
        }
        const quantity = Number.isFinite(item.quantity) ? item.quantity : 1
        const listLineTotal = getNumberValue(item.listLineTotal)
            ?? ((getNumberValue(item.listUnitPrice) ?? 0) * quantity)
        const customerLineTotal = getNumberValue(item.customerLineTotal)
            ?? ((getNumberValue(item.customerUnitPrice) ?? getNumberValue(item.listUnitPrice) ?? 0) * quantity)

        current.listTotal += listLineTotal
        current.customerTotal += customerLineTotal
        summary.set(currency, current)
    }

    return Array.from(summary.values())
}

export function OrdersTable({
    orders,
    isLoading,
    emptyMessage,
    showCustomer = false,
}: Props) {
    if (isLoading) {
        return (
            <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
                Siparişler yükleniyor...
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-[28px] border border-dashed border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sipariş</TableHead>
                        {showCustomer ? <TableHead>Müşteri</TableHead> : null}
                        <TableHead>Kalem Özeti</TableHead>
                        <TableHead>Vade / Termin</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => {
                        const firstItem = order.items?.[0]
                        const dataProductName = typeof firstItem?.data?.productName === "string"
                            ? firstItem.data.productName
                            : null
                        const itemLabel = firstItem?.productVariant?.product?.name
                            ?? dataProductName
                            ?? "Kalem bilgisi"
                        const requesterLabel = order.requestedByUser
                            ? getUserDisplayName(order.requestedByUser) || order.requestedByUser.email
                            : "-"
                        const currencySummary = buildOrderCurrencySummary(order)
                        const paymentTermLabels = getOrderPaymentTermLabels(order)
                        const hasMixedCurrency = currencySummary.length > 1 || order.currency === "MIXED"
                        const hasMixedPaymentTerms = paymentTermLabels.length > 1

                        return (
                            <TableRow key={order.id} className="align-top">
                                <TableCell className="min-w-[220px]">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                                            <Package2 className="h-3.5 w-3.5" />
                                            {order.orderNumber}
                                        </div>
                                        <div className="font-medium text-neutral-950">{order.title}</div>
                                        <div className="text-xs text-neutral-500">
                                            {formatDate(order.createdAt)} • Talebi açan: {requesterLabel}
                                        </div>
                                        {order.referenceCode ? (
                                            <div className="text-xs text-neutral-500">Ref: {order.referenceCode}</div>
                                        ) : null}
                                    </div>
                                </TableCell>
                                {showCustomer ? (
                                    <TableCell className="min-w-[180px]">
                                        <div className="space-y-1">
                                            <div className="font-medium text-neutral-900">
                                                {order.customer.companyName || order.customer.fullName}
                                            </div>
                                            <div className="text-xs text-neutral-500">{order.customer.email}</div>
                                        </div>
                                    </TableCell>
                                ) : null}
                                <TableCell className="min-w-[260px]">
                                    <div className="space-y-1 text-sm text-neutral-700">
                                        <div>
                                            {itemLabel}
                                            {(order.items?.length ?? 0) > 1 ? ` +${(order.items?.length ?? 1) - 1} kalem` : ""}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            Toplam {order.totalQuantity} adet
                                        </div>
                                        {order.shippingAddressLabel ? (
                                            <div className="text-xs text-neutral-500">
                                                Sevkiyat: {order.shippingAddressLabel}
                                            </div>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                    <div className="space-y-1 text-sm text-neutral-700">
                                        <div>
                                            {hasMixedPaymentTerms
                                                ? "Kalem bazında değişiyor"
                                                : paymentTermLabels[0]}
                                        </div>
                                        {hasMixedPaymentTerms ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {paymentTermLabels.map((label) => (
                                                    <span key={label} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                        <div className="text-xs text-neutral-500">
                                            Talep termin: {formatDate(order.requestedDeliveryDate)}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                    <div className="space-y-1">
                                        {hasMixedCurrency ? (
                                            <div className="space-y-2">
                                                {currencySummary.map((summary) => (
                                                    <div key={summary.currency} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                                                            {summary.currency}
                                                        </div>
                                                        <div className="mt-1 font-semibold text-neutral-950">
                                                            {formatMoney(summary.customerTotal, summary.currency)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                {order.discountPercent && order.discountPercent > 0 && order.listSubtotal ? (
                                                    <div className="text-xs text-neutral-400 line-through">
                                                        {formatMoney(order.listSubtotal, order.currency)}
                                                    </div>
                                                ) : null}
                                                <div className="font-semibold text-neutral-950">
                                                    {formatMoney(order.customerSubtotal ?? order.listSubtotal, order.currency)}
                                                </div>
                                                {order.discountPercent && order.discountPercent > 0 ? (
                                                    <div className="text-xs font-medium text-emerald-700">
                                                        %{order.discountPercent.toLocaleString("tr-TR")} genel iskonto
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                        {hasMixedCurrency ? (
                                            <div className="text-xs text-amber-700">
                                                Toplamlar para birimine göre ayrıldı.
                                            </div>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <OrderStatusBadge status={order.status} />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
