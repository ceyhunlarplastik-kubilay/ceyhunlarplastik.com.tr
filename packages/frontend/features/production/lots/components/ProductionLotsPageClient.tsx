"use client"

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { Search, Tags } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { addDaysToDateKey, isValidDateKey } from "@core/helpers/production/productionCalendar"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useProductionLots } from "@/features/production/lots/hooks/useProductionLots"
import { useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { LotsTable } from "./LotsTable"

const DEFAULT_LIMIT = 20
const WINDOW_DAYS = 7
const ALL_MACHINES = "__all__"

/**
 * Vardiya lotları. Liste büyüdüğü için sunucuda sayfalanır; tarih aralığı, makine, arama, sayfa
 * URL'de. Arama (lot no "1000-2", iş kökü / emir no, varyant, ürün, makine, kalıp) tüm tarihlerde yapılır.
 */
export function ProductionLotsPageClient() {
    const [{ bas, bit, makine, q, sayfa: page, adet: limit }, setFilters] = useQueryStates({
        bas: parseAsString,
        bit: parseAsString,
        makine: parseAsString.withDefault(""),
        q: parseAsString.withDefault(""),
        sayfa: parseAsInteger.withDefault(1),
        adet: parseAsInteger.withDefault(DEFAULT_LIMIT),
    })
    const today = productionDateKey(useNow())
    const from = bas && isValidDateKey(bas) ? bas : today
    const to = bit && isValidDateKey(bit) && bit >= from ? bit : addDaysToDateKey(from, WINDOW_DAYS - 1)
    const search = q.trim()

    const machinesQuery = useProductionMachines()
    const lotsQuery = useProductionLots({ page, limit, from, to, machineId: makine, q: search })
    const lots = lotsQuery.data?.data ?? []
    const meta = lotsQuery.data?.meta
    const isInitialLoading = lotsQuery.isLoading && !lotsQuery.data
    const isBackgroundRefetch = lotsQuery.isFetching && !isInitialLoading
    const machines = (machinesQuery.data ?? []).filter((machine) => machine.status !== "INACTIVE")

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Tags />}
                title="Lotlar"
                description="İşlerin vardiyaya düşen dilimleri (1000-1, 1000-2…). Lot numarasına tıklayınca ekip, notlar ve etiket açılır. Ekip soluk yazılmışsa vardiya ekibinden geliyor."
            />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_14rem]">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(event) => void setFilters({ q: event.target.value || null, sayfa: null })}
                        placeholder="Lot no (1000-2), emir no, varyant kodu, ürün, makine ya da kalıp ara"
                        aria-label="Lot ara"
                        className="ps-9"
                    />
                </div>
                <Input
                    type="date"
                    value={from}
                    disabled={Boolean(search)}
                    onChange={(event) => { if (isValidDateKey(event.target.value)) void setFilters({ bas: event.target.value, sayfa: null }) }}
                    aria-label="Başlangıç günü"
                />
                <Input
                    type="date"
                    value={to}
                    min={from}
                    disabled={Boolean(search)}
                    onChange={(event) => { if (isValidDateKey(event.target.value)) void setFilters({ bit: event.target.value, sayfa: null }) }}
                    aria-label="Bitiş günü"
                />
                <Select value={makine || ALL_MACHINES} onValueChange={(value) => void setFilters({ makine: value === ALL_MACHINES ? null : value, sayfa: null })}>
                    <SelectTrigger className="w-full" aria-label="Makineye göre süz">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_MACHINES}>Tüm makineler</SelectItem>
                        {machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>{machine.code} · {machine.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {search ? (
                <p className="-mt-3 text-xs text-muted-foreground">Arama tüm tarihlerde yapılıyor; tarih süzgeci için aramayı temizleyin.</p>
            ) : null}

            {isInitialLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : lots.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Tags />
                        </EmptyMedia>
                        <EmptyTitle>{search || makine ? "Süzgeçle eşleşen lot yok" : "Bu aralıkta lot yok"}</EmptyTitle>
                        <EmptyDescription>
                            Lotlar, bir emir planlanınca (Üretim Emirleri ya da Planlama Tahtası) vardiya başına oluşur.
                        </EmptyDescription>
                    </EmptyHeader>
                    {search || makine ? (
                        <EmptyContent>
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, makine: null, sayfa: null })}>
                                Süzgeçleri temizle
                            </Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar
                        dataUpdatedAt={lotsQuery.dataUpdatedAt}
                        isFetching={lotsQuery.isFetching}
                        onRefresh={() => void lotsQuery.refetch()}
                    />
                    <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        <LotsTable lots={lots} />
                    </div>
                    <AdminListPagination
                        page={meta?.page ?? page}
                        totalPages={meta?.totalPages}
                        total={meta?.total}
                        limit={limit}
                        itemLabel="lot"
                        onPageChange={(next) => void setFilters({ sayfa: next === 1 ? null : next })}
                        onLimitChange={(next) => void setFilters({ adet: next === DEFAULT_LIMIT ? null : next, sayfa: null })}
                    />
                </div>
            )}
        </div>
    )
}
