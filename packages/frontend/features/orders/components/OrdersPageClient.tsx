"use client"

import { motion } from "motion/react"
import { PackageCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"
import type { OrderListScope } from "@/features/orders/api/types"
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from "@/features/orders/config"
import { OrdersTable } from "@/features/orders/components/OrdersTable"
import { useOrderFilters } from "@/features/orders/hooks/useOrderFilters"
import { useOrders } from "@/features/orders/hooks/useOrders"

type Props = {
    title: string
    description: string
    scope: OrderListScope
}

export function OrdersPageClient({
    title,
    description,
    scope,
}: Props) {
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setLimit,
    } = useOrderFilters()

    const ordersQuery = useOrders({
        scope,
        params,
    })

    const lastUpdatedLabel = ordersQuery.dataUpdatedAt
        ? new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(ordersQuery.dataUpdatedAt))
        : "-"

    const showPortalHeader = scope === "portal"

    return (
        <div className="space-y-6">
            {showPortalHeader ? (
                <CustomerPortalPageHeader
                    eyebrow="Sipariş Takibi"
                    icon={PackageCheck}
                    title={title}
                    description={description}
                    meta={[{ value: lastUpdatedLabel, label: "son güncelleme" }]}
                    aside={(
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 bg-white/80 backdrop-blur"
                            disabled={ordersQuery.isFetching}
                            onClick={() => void ordersQuery.refetch()}
                        >
                            <motion.span
                                className="inline-flex"
                                animate={ordersQuery.isFetching ? { rotate: 360 } : { rotate: 0 }}
                                transition={ordersQuery.isFetching
                                    ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                                    : { duration: 0.2 }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </motion.span>
                            Yenile
                        </Button>
                    )}
                />
            ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
                        <p className="text-sm text-neutral-500">{description}</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={ordersQuery.isFetching}
                        onClick={() => void ordersQuery.refetch()}
                    >
                        <motion.span
                            className="inline-flex"
                            animate={ordersQuery.isFetching ? { rotate: 360 } : { rotate: 0 }}
                            transition={ordersQuery.isFetching
                                ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                                : { duration: 0.2 }}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </motion.span>
                        Yenile
                    </Button>
                </div>
            )}

            <div className="space-y-4 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_160px]">
                    <Input
                        placeholder="Sipariş no, referans veya müşteri ara"
                        value={filters.search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Select value={filters.status || "__all__"} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tüm durumlar</SelectItem>
                            {ORDER_STATUS_VALUES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {ORDER_STATUS_LABELS[status]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(filters.limit)} onValueChange={(value) => setLimit(Number(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sayfa boyutu" />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50].map((limit) => (
                                <SelectItem key={limit} value={String(limit)}>
                                    {limit} kayıt
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    <span>Son güncelleme: {lastUpdatedLabel}</span>
                    <span>{ordersQuery.isFetching ? "Sipariş listesi yenileniyor..." : "Sipariş listesi güncel"}</span>
                </div>

                <OrdersTable
                    orders={ordersQuery.data?.data ?? []}
                    isLoading={ordersQuery.isLoading}
                    emptyMessage="Henüz listelenecek sipariş bulunmuyor."
                    showCustomer={scope !== "portal"}
                />
            </div>
        </div>
    )
}
