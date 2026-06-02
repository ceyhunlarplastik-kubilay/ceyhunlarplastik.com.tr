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
import { formatMoney, formatPaymentTermLabel } from "@/lib/customers/pricing"
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
                                        <div>{formatPaymentTermLabel(order.paymentTermDays)}</div>
                                        <div className="text-xs text-neutral-500">
                                            Talep termin: {formatDate(order.requestedDeliveryDate)}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                    <div className="space-y-1">
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
