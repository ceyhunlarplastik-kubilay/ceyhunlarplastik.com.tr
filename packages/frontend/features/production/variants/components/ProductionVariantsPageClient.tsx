"use client"

import { useState } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { Package, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import type { ProductionVariant } from "@/features/production/variants/api/types"
import { useProductionVariants } from "@/features/production/variants/hooks/useProductionVariants"
import { ProductionVariantsTable } from "./ProductionVariantsTable"
import { VariantCycleDialog } from "./VariantCycleDialog"

const DEFAULT_LIMIT = 20

/**
 * Üretim varyantları: yalnız İÇ ÜRETİM tedarikçisine bağlı katalog varyantları. Sunucuda sayfalanır;
 * arama, sayfa ve sayfa boyutu URL'de.
 */
export function ProductionVariantsPageClient() {
    const [{ q: search, sayfa: page, adet: limit }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        sayfa: parseAsInteger.withDefault(1),
        adet: parseAsInteger.withDefault(DEFAULT_LIMIT),
    })
    const variantsQuery = useProductionVariants({ page, limit, q: search.trim() })
    const [editing, setEditing] = useState<ProductionVariant | null>(null)

    const variants = variantsQuery.data?.data ?? []
    const meta = variantsQuery.data?.meta
    const isInitialLoading = variantsQuery.isLoading && !variantsQuery.data
    const isBackgroundRefetch = variantsQuery.isFetching && !isInitialLoading

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Package />}
                title="Üretim Varyantları"
                description="Kendi ürettiğimiz varyantlar: iç üretim tedarikçisine bağlı katalog kayıtları. Buradan varyanta özel çevrim süresi girilir; ürün, ölçü ve versiyon bilgisi Veri Girişi panelinden yönetilir."
            />

            <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => void setFilters({ q: event.target.value || null, sayfa: null })}
                    placeholder="Varyant kodu (10.5.8.V1) ya da ürün adı ara"
                    aria-label="Varyant ara"
                    className="ps-9"
                />
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : variants.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Package />
                        </EmptyMedia>
                        <EmptyTitle>{search ? "Aramayla eşleşen varyant yok" : "İç üretim varyantı yok"}</EmptyTitle>
                        <EmptyDescription>
                            {search
                                ? "Aramayı temizleyip tekrar deneyin."
                                : "Yönetim panelinde bir tedarikçi \"Kendi üretimimiz (iç üretim)\" olarak işaretlenmeli ve varyantlar o tedarikçiye bağlanmalı."}
                        </EmptyDescription>
                    </EmptyHeader>
                    {search ? (
                        <EmptyContent>
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, sayfa: null })}>
                                Aramayı temizle
                            </Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar
                        dataUpdatedAt={variantsQuery.dataUpdatedAt}
                        isFetching={variantsQuery.isFetching}
                        onRefresh={() => void variantsQuery.refetch()}
                    />
                    <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        <ProductionVariantsTable variants={variants} onEdit={setEditing} />
                    </div>
                    <AdminListPagination
                        page={meta?.page ?? page}
                        totalPages={meta?.totalPages}
                        total={meta?.total}
                        limit={limit}
                        itemLabel="varyant"
                        onPageChange={(next) => void setFilters({ sayfa: next === 1 ? null : next })}
                        onLimitChange={(next) => void setFilters({ adet: next === DEFAULT_LIMIT ? null : next, sayfa: null })}
                    />
                </div>
            )}

            <VariantCycleDialog variant={editing} onOpenChange={(open) => { if (!open) setEditing(null) }} />
        </div>
    )
}
