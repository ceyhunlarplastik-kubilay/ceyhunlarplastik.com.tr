"use client"

import { useState } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { ClipboardList, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatProductionOrderNumber } from "@core/helpers/production/productionOrders"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import type { ProductionOrder, ProductionOrderStatus } from "@/features/production/orders/api/types"
import {
    useDeleteProductionOrder,
    useProductionOrders,
    useUpdateProductionOrder,
} from "@/features/production/orders/hooks/useProductionOrders"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { ORDER_STATUS_FILTER_OPTIONS, ORDER_STATUS_LABELS } from "@/features/production/shared/orderStatus"
import { OrderCandidatesDialog } from "./OrderCandidatesDialog"
import { ProductionOrderFormDialog } from "./ProductionOrderFormDialog"
import { ProductionOrdersTable } from "./ProductionOrdersTable"

const DEFAULT_STATUS = "open"
const DEFAULT_LIMIT = 20

/**
 * Üretim emirleri. Liste zamanla büyüdüğü için sunucuda sayfalanır; arama, durum, sayfa ve
 * sayfa boyutu URL'de (AGENTS.md: sunucuya sayfalanan listede filtre query parametresi).
 */
export function ProductionOrdersPageClient() {
    const [{ q: search, durum: status, sayfa: page, adet: limit }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        durum: parseAsString.withDefault(DEFAULT_STATUS),
        sayfa: parseAsInteger.withDefault(1),
        adet: parseAsInteger.withDefault(DEFAULT_LIMIT),
    })
    const today = productionDateKey(useNow())
    const ordersQuery = useProductionOrders({ page, limit, q: search.trim(), status })
    const updateMutation = useUpdateProductionOrder()
    const deleteMutation = useDeleteProductionOrder()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductionOrder | null>(null)
    const [planning, setPlanning] = useState<ProductionOrder | null>(null)

    const orders = ordersQuery.data?.data ?? []
    const meta = ordersQuery.data?.meta
    const isInitialLoading = ordersQuery.isLoading && !ordersQuery.data
    const isBackgroundRefetch = ordersQuery.isFetching && !isInitialLoading
    const hasFilters = Boolean(search || status !== DEFAULT_STATUS)

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(order: ProductionOrder) {
        setEditing(order)
        setDialogOpen(true)
    }

    async function changeStatus(order: ProductionOrder, next: ProductionOrderStatus) {
        try {
            await updateMutation.mutateAsync({ id: order.id, input: { status: next } })
            toast.success(`${formatProductionOrderNumber(order.orderNumber)} → ${ORDER_STATUS_LABELS[next]}`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    async function remove(order: ProductionOrder) {
        try {
            await deleteMutation.mutateAsync(order.id)
            toast.success(`${formatProductionOrderNumber(order.orderNumber)} silindi`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<ClipboardList />}
                title="Üretim Emirleri"
                description="Hangi varyanttan kaç sağlam adet, hangi termine kadar üretilecek. Emir yalnız kalıbı olan ölçüye açılır; makine, zaman ve vardiya lotları planlamada belirlenir."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Emir
                    </Button>
                )}
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => void setFilters({ q: event.target.value || null, sayfa: null })}
                        placeholder="Emir no (UE-1001), varyant kodu, ürün ya da müşteri ara"
                        aria-label="Emir ara"
                        className="ps-9"
                    />
                </div>
                <Select
                    value={status}
                    onValueChange={(value) => void setFilters({ durum: value === DEFAULT_STATUS ? null : value, sayfa: null })}
                >
                    <SelectTrigger className="w-full" aria-label="Duruma göre filtrele">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : orders.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <ClipboardList />
                        </EmptyMedia>
                        <EmptyTitle>{hasFilters ? "Filtreyle eşleşen emir yok" : "Açık üretim emri yok"}</EmptyTitle>
                        <EmptyDescription>
                            {hasFilters
                                ? "Filtreleri temizleyip tekrar deneyin; kapanmış emirler için durumu \"Tümü\" yapın."
                                : "Kalıbı olan bir ölçünün varyantı için emir açın: adet, termin ve öncelik yeter."}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        {hasFilters ? (
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, durum: null, sayfa: null })}>
                                Filtreleri temizle
                            </Button>
                        ) : (
                            <Button type="button" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                İlk emri oluştur
                            </Button>
                        )}
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar
                        dataUpdatedAt={ordersQuery.dataUpdatedAt}
                        isFetching={ordersQuery.isFetching}
                        onRefresh={() => void ordersQuery.refetch()}
                    />
                    <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        <ProductionOrdersTable
                            orders={orders}
                            today={today}
                            onEdit={openEdit}
                            onPlan={setPlanning}
                            onStatusChange={(order, next) => void changeStatus(order, next)}
                            onDelete={(order) => void remove(order)}
                        />
                    </div>
                    <AdminListPagination
                        page={meta?.page ?? page}
                        totalPages={meta?.totalPages}
                        total={meta?.total}
                        limit={limit}
                        itemLabel="emir"
                        onPageChange={(next) => void setFilters({ sayfa: next === 1 ? null : next })}
                        onLimitChange={(next) => void setFilters({ adet: next === DEFAULT_LIMIT ? null : next, sayfa: null })}
                    />
                </div>
            )}

            <ProductionOrderFormDialog open={dialogOpen} onOpenChange={setDialogOpen} order={editing} />
            <OrderCandidatesDialog order={planning} onOpenChange={(open) => { if (!open) setPlanning(null) }} />
        </div>
    )
}
