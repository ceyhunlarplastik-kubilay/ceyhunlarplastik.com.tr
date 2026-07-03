"use client"

import { useMemo, useState } from "react"
import { ArrowRight, ImageIcon, Minus, Plus, RefreshCcw, Save, Search, Shuffle, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { IndustrialUsageHierarchySelect } from "@/features/admin/industrialUsageAssignments/components/IndustrialUsageHierarchySelect"
import { IndustrialUsageAssignmentProductsGrid } from "@/features/admin/industrialUsageAssignments/components/IndustrialUsageAssignmentProductsGrid"
import { useIndustrialUsageAssignmentFilters } from "@/features/admin/industrialUsageAssignments/hooks/useIndustrialUsageAssignmentFilters"
import {
    useIndustrialUsageAssignmentProducts,
    usePatchIndustrialUsageAssignmentProducts,
} from "@/features/admin/industrialUsageAssignments/hooks/useIndustrialUsageAssignments"
import type {
    IndustrialUsageAssignmentFilter,
    IndustrialUsageAssignmentProduct,
} from "@/features/admin/industrialUsageAssignments/api/types"

const assignmentLabels: Record<IndustrialUsageAssignmentFilter, string> = {
    all: "Tüm ürünler",
    assigned: "Atanmış",
    unassigned: "Atanmamış",
}

const EMPTY_ID_SET = new Set<string>()
const EMPTY_PRODUCT_MAP = new Map<string, IndustrialUsageAssignmentProduct>()

type PendingSelectionState = {
    usageAreaValueId: string
    addIds: Set<string>
    removeIds: Set<string>
    productsById: Map<string, IndustrialUsageAssignmentProduct>
}

type Props = {
    workspaceLabel: string
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("tr-TR").format(value)
}

function getPendingProducts(
    ids: Set<string>,
    productsById: Map<string, IndustrialUsageAssignmentProduct>,
) {
    return Array.from(ids)
        .map((id) => productsById.get(id))
        .filter((product): product is IndustrialUsageAssignmentProduct => Boolean(product))
}

function PendingProductList({
    title,
    tone,
    products,
}: {
    title: string
    tone: "add" | "remove"
    products: IndustrialUsageAssignmentProduct[]
}) {
    const Icon = tone === "add" ? Plus : Minus

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "grid h-8 w-8 place-items-center rounded-xl",
                            tone === "add"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700",
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-950">{title}</div>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        "rounded-full",
                        tone === "add"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700",
                    )}
                >
                    {products.length}
                </Badge>
            </div>

            {products.length > 0 ? (
                <div className="mt-3 space-y-2">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5"
                        >
                            <div className="flex aspect-square h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                                {product.primaryImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={product.primaryImageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-contain p-2"
                                    />
                                ) : (
                                    <ImageIcon className="h-6 w-6 text-neutral-300" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-neutral-950">
                                        {product.code}
                                    </span>
                                    {product.category ? (
                                        <span className="truncate text-xs font-medium text-neutral-500">
                                            {product.category.name}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-neutral-800">
                                    {product.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
                    Bu grupta bekleyen ürün yok.
                </p>
            )}
        </div>
    )
}

export function IndustrialUsageAssignmentsPageClient({ workspaceLabel }: Props) {
    const attributesQuery = useAttributesForFilter()
    const {
        filters,
        params,
        setHierarchySelection,
        setSearch,
        setAssignment,
        setPage,
        setLimit,
        clearProductFilters,
    } = useIndustrialUsageAssignmentFilters()

    const canListProducts = Boolean(filters.sectorValueId && filters.usageAreaValueId)
    const productsQuery = useIndustrialUsageAssignmentProducts({
        usageAreaValueId: canListProducts ? filters.usageAreaValueId : "",
        params,
    })
    const patchMutation = usePatchIndustrialUsageAssignmentProducts(filters.usageAreaValueId)

    const [pendingSelection, setPendingSelection] = useState<PendingSelectionState>(() => ({
        usageAreaValueId: "",
        addIds: new Set(),
        removeIds: new Set(),
        productsById: new Map(),
    }))
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

    const data = productsQuery.data
    const pendingAddIds =
        pendingSelection.usageAreaValueId === filters.usageAreaValueId
            ? pendingSelection.addIds
            : EMPTY_ID_SET
    const pendingRemoveIds =
        pendingSelection.usageAreaValueId === filters.usageAreaValueId
            ? pendingSelection.removeIds
            : EMPTY_ID_SET
    const pendingProductsById =
        pendingSelection.usageAreaValueId === filters.usageAreaValueId
            ? pendingSelection.productsById
            : EMPTY_PRODUCT_MAP
    const pendingChangeCount = pendingAddIds.size + pendingRemoveIds.size
    const selectedHierarchy = data?.hierarchy
    const pendingAddProducts = useMemo(
        () => getPendingProducts(pendingAddIds, pendingProductsById),
        [pendingAddIds, pendingProductsById],
    )
    const pendingRemoveProducts = useMemo(
        () => getPendingProducts(pendingRemoveIds, pendingProductsById),
        [pendingRemoveIds, pendingProductsById],
    )

    const statusText = useMemo(() => {
        if (!canListProducts) return "Sektör ve kullanım alanı seçin"
        if (productsQuery.isLoading) return "Ürünler yükleniyor"
        return `${formatNumber(data?.assignedTotal ?? 0)} atanmış ürün`
    }, [canListProducts, data?.assignedTotal, productsQuery.isLoading])

    const handleToggleProduct = (
        product: IndustrialUsageAssignmentProduct,
        checked: boolean,
    ) => {
        if (!filters.usageAreaValueId) return

        setPendingSelection((current) => {
            const base = current.usageAreaValueId === filters.usageAreaValueId
                ? current
                : {
                    usageAreaValueId: filters.usageAreaValueId,
                    addIds: new Set<string>(),
                    removeIds: new Set<string>(),
                    productsById: new Map<string, IndustrialUsageAssignmentProduct>(),
                }

            const nextAddIds = new Set(base.addIds)
            const nextRemoveIds = new Set(base.removeIds)
            const nextProductsById = new Map(base.productsById)

            if (product.isAssigned) {
                nextAddIds.delete(product.id)
                if (checked) nextRemoveIds.delete(product.id)
                else nextRemoveIds.add(product.id)
            } else {
                nextRemoveIds.delete(product.id)
                if (checked) nextAddIds.add(product.id)
                else nextAddIds.delete(product.id)
            }

            if (nextAddIds.has(product.id) || nextRemoveIds.has(product.id)) {
                nextProductsById.set(product.id, product)
            } else {
                nextProductsById.delete(product.id)
            }

            return {
                usageAreaValueId: filters.usageAreaValueId,
                addIds: nextAddIds,
                removeIds: nextRemoveIds,
                productsById: nextProductsById,
            }
        })
    }

    const clearPendingChanges = () => {
        setConfirmDialogOpen(false)
        setPendingSelection({
            usageAreaValueId: filters.usageAreaValueId,
            addIds: new Set(),
            removeIds: new Set(),
            productsById: new Map(),
        })
    }

    const handleConfirmSave = async () => {
        if (!filters.usageAreaValueId || pendingChangeCount === 0) return

        await patchMutation.mutateAsync({
            addProductIds: Array.from(pendingAddIds),
            removeProductIds: Array.from(pendingRemoveIds),
        })
        clearPendingChanges()
        setConfirmDialogOpen(false)
    }

    const handleRefresh = async () => {
        await productsQuery.refetch()
        toast.success("Liste yenilendi")
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                                {workspaceLabel}
                            </Badge>
                            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Kullanım Alanı Ürün Atamaları
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                                Ürün modeline girmeden, seçili endüstriyel kullanım alanına uygun ürünleri toplu olarak ekleyip çıkarın.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Durum
                                </div>
                                <div className="mt-1 text-sm font-semibold">{statusText}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Eklenecek
                                </div>
                                <div className="mt-1 text-xl font-semibold">{pendingAddIds.size}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Çıkarılacak
                                </div>
                                <div className="mt-1 text-xl font-semibold">{pendingRemoveIds.size}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedHierarchy ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-4 text-sm text-neutral-600 sm:px-7">
                        <span className="font-medium text-neutral-950">{selectedHierarchy.sector.name}</span>
                        <ArrowRight className="h-4 w-4 text-neutral-300" />
                        <span className="font-medium text-neutral-950">{selectedHierarchy.productionGroup.name}</span>
                        <ArrowRight className="h-4 w-4 text-neutral-300" />
                        <span className="font-semibold text-brand">{selectedHierarchy.usageArea.name}</span>
                    </div>
                ) : null}
            </section>

            <IndustrialUsageHierarchySelect
                attributes={attributesQuery.data}
                isLoading={attributesQuery.isLoading}
                sectorValueId={filters.sectorValueId}
                productionGroupValueId={filters.productionGroupValueId}
                usageAreaValueId={filters.usageAreaValueId}
                onSelectionChange={setHierarchySelection}
            />

            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-950">Ürünler</h2>
                        <p className="text-sm text-neutral-500">
                            Seçili kullanım alanı için ürünleri arayın, filtreleyin ve işaretleyin.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearPendingChanges}
                            disabled={pendingChangeCount === 0 || patchMutation.isPending}
                        >
                            <X className="h-4 w-4" />
                            Değişiklikleri At
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={
                                !canListProducts ||
                                pendingChangeCount === 0 ||
                                patchMutation.isPending
                            }
                        >
                            <Save className="h-4 w-4" />
                            {patchMutation.isPending ? "Kaydediliyor" : "Atamaları Kaydet"}
                        </Button>
                    </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={filters.search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Ürün kodu, adı veya slug ara"
                            disabled={!canListProducts}
                            className="h-11 rounded-2xl pl-9"
                        />
                    </div>

                    <Select
                        value={filters.assignment}
                        onValueChange={(value) => setAssignment(value as IndustrialUsageAssignmentFilter)}
                        disabled={!canListProducts}
                    >
                        <SelectTrigger className="h-11 w-full rounded-2xl">
                            <SelectValue placeholder="Atanma filtresi" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(assignmentLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearProductFilters}
                            disabled={!canListProducts}
                        >
                            <Shuffle className="h-4 w-4" />
                            Temizle
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={!canListProducts || productsQuery.isFetching}
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Yenile
                        </Button>
                    </div>
                </div>
            </section>

            {!canListProducts ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                        <Shuffle className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-neutral-950">
                        Sektör ve kullanım alanı seçin
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                        Üretim grubu zorunlu değildir; kullanım alanı seçildiğinde varsa üst hiyerarşi otomatik tamamlanır.
                    </p>
                </div>
            ) : (
                <>
                    <IndustrialUsageAssignmentProductsGrid
                        products={data?.data ?? []}
                        isLoading={productsQuery.isLoading && !data}
                        isFetching={productsQuery.isFetching && Boolean(data)}
                        pendingAddIds={pendingAddIds}
                        pendingRemoveIds={pendingRemoveIds}
                        onToggleProduct={handleToggleProduct}
                    />

                    <AdminListPagination
                        page={data?.meta.page ?? filters.page}
                        totalPages={data?.meta.totalPages ?? 1}
                        total={data?.meta.total ?? 0}
                        limit={filters.limit}
                        itemLabel="ürün"
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </>
            )}

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] max-w-3xl overflow-hidden rounded-3xl p-0">
                    <DialogHeader className="border-b border-neutral-100 bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-5 text-white sm:px-6">
                        <Badge
                            variant="outline"
                            className="w-fit border-white/15 bg-white/10 text-white"
                        >
                            Son Onay
                        </Badge>
                        <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                            Atamaları kaydetmeden önce kontrol edin
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            Seçili kullanım alanına eklenecek ve çıkarılacak ürünler aşağıda listelenir.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-5 py-4 sm:px-6">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                Seçili Hiyerarşi
                            </div>
                            {selectedHierarchy ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-medium text-neutral-950">
                                        {selectedHierarchy.sector.name}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-neutral-300" />
                                    <span className="font-medium text-neutral-950">
                                        {selectedHierarchy.productionGroup.name}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-neutral-300" />
                                    <span className="font-semibold text-brand">
                                        {selectedHierarchy.usageArea.name}
                                    </span>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-neutral-500">
                                    Seçili kullanım alanı
                                </p>
                            )}
                        </div>
                    </div>

                    <ScrollArea className="max-h-[380px] px-5 pb-2 sm:px-6">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <PendingProductList
                                title="Eklenecek Ürünler"
                                tone="add"
                                products={pendingAddProducts}
                            />
                            <PendingProductList
                                title="Çıkarılacak Ürünler"
                                tone="remove"
                                products={pendingRemoveProducts}
                            />
                        </div>
                    </ScrollArea>

                    <DialogFooter className="border-t border-neutral-100 bg-white px-5 py-4 sm:px-6">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={patchMutation.isPending}
                                className="rounded-2xl"
                            >
                                Vazgeç
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={handleConfirmSave}
                            disabled={patchMutation.isPending || pendingChangeCount === 0}
                            className="rounded-2xl"
                        >
                            <Save className="h-4 w-4" />
                            {patchMutation.isPending
                                ? "Kaydediliyor"
                                : "Atamaları Kaydetmeyi Onayla"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
