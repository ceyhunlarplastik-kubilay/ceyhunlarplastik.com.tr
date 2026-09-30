"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs"
import { Grid3x3, Search, Star, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useProductionAreas } from "@/features/production/areas/hooks/useProductionAreas"
import { buildCompatibilityMatrix } from "@/features/production/compatibility/lib/buildCompatibilityMatrix"
import {
    COMPATIBILITY_LEVEL_META,
    COMPATIBILITY_LEVEL_ORDER,
} from "@/features/production/compatibility/lib/compatibilityPresentation"
import { useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import { useMolds } from "@/features/production/molds/hooks/useMolds"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { cn } from "@/lib/utils"
import { CompatibilityDetailDialog, type CompatibilitySelection } from "./CompatibilityDetailDialog"
import { CompatibilityMatrixTable } from "./CompatibilityMatrixTable"

const ALL_VALUE = "__all__"

export function CompatibilityMatrixPageClient() {
    // Filtreler URL'de: ekran paylaşılabilir, geri tuşu filtreyi korur (AGENTS.md).
    const [{ q: search, alan: areaId, tumu: showInactive }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        alan: parseAsString.withDefault(""),
        tumu: parseAsBoolean.withDefault(false),
    })
    const moldsQuery = useMolds()
    const machinesQuery = useProductionMachines()
    const areasQuery = useProductionAreas()
    const [selection, setSelection] = useState<CompatibilitySelection | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    const molds = useMemo(() => moldsQuery.data ?? [], [moldsQuery.data])
    const machines = useMemo(() => machinesQuery.data ?? [], [machinesQuery.data])
    const matrix = useMemo(
        () => buildCompatibilityMatrix(molds, machines, { search, areaId, showInactive }),
        [areaId, machines, molds, search, showInactive],
    )

    const isInitialLoading = (moldsQuery.isLoading && molds.length === 0) || (machinesQuery.isLoading && machines.length === 0)
    const isBackgroundRefetch = !isInitialLoading && (moldsQuery.isFetching || machinesQuery.isFetching)
    const hasFilters = Boolean(search || areaId || showInactive)

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Grid3x3 />}
                title="Uyumluluk Matrisi"
                description="Hangi kalıp hangi makinede çalışır: tonaj, kolonlar arası, kalınlık, açılma, baskı ağırlığı, sıcak yolluk, maça ve robot. Boş bırakılan teknik değer planı kilitlemez, eksik bilgi olarak görünür."
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-center">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => void setFilters({ q: event.target.value || null })}
                        placeholder="Kalıp kodu, ad, ölçü kodu (1.3.8) veya ürün modeli ara"
                        aria-label="Kalıp ara"
                        className="ps-9"
                    />
                </div>
                <Select
                    value={areaId || ALL_VALUE}
                    onValueChange={(value) => void setFilters({ alan: value === ALL_VALUE ? null : value })}
                >
                    <SelectTrigger className="w-full" aria-label="Makineleri alana göre daralt">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tüm alanlar</SelectItem>
                        {(areasQuery.data ?? []).map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                                {area.code} · {area.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="uyumluluk-tumu"
                        checked={showInactive}
                        onCheckedChange={(checked) => void setFilters({ tumu: checked === true ? true : null })}
                    />
                    <Label htmlFor="uyumluluk-tumu" className="font-normal">Kullanım dışıları göster</Label>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {COMPATIBILITY_LEVEL_ORDER.map((level) => {
                    const meta = COMPATIBILITY_LEVEL_META[level]
                    const Icon = meta.icon
                    return (
                        <span key={level} className="inline-flex items-center gap-1">
                            <Icon className={cn("h-4 w-4", meta.className)} aria-hidden />
                            {meta.label}
                            <span className="tabular-nums">({matrix.totals[level]})</span>
                        </span>
                    )
                })}
                <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-600" aria-hidden />
                    Önerilen: tercih edilen ya da en küçük uygun makine
                </span>
                <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                    Kalıp kartında tercih edilen
                </span>
                <span>Yüzde: gerekli tonajın makine tonajına oranı</span>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-72 rounded-2xl" />
            ) : machines.length === 0 || molds.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Grid3x3 />
                        </EmptyMedia>
                        <EmptyTitle>{machines.length === 0 ? "Henüz makine yok" : "Henüz kalıp yok"}</EmptyTitle>
                        <EmptyDescription>
                            Matris için en az bir makine ve bir kalıp gerekir; teknik değerler ne kadar doluysa sonuç o kadar
                            kesin olur.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href={machines.length === 0 ? "/uretim/makineler" : "/uretim/kaliplar"}>
                                {machines.length === 0 ? "Makinelere git" : "Kalıplara git"}
                            </Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : matrix.rows.length === 0 || matrix.machines.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Grid3x3 />
                        </EmptyMedia>
                        <EmptyTitle>
                            {matrix.machines.length === 0 ? "Bu alanda gösterilecek makine yok" : "Filtreyle eşleşen kalıp yok"}
                        </EmptyTitle>
                        <EmptyDescription>Filtreleri temizleyip tekrar deneyin.</EmptyDescription>
                    </EmptyHeader>
                    {hasFilters ? (
                        <EmptyContent>
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, alan: null, tumu: null })}>
                                Filtreleri temizle
                            </Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : (
                <div className="relative" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <CompatibilityMatrixTable
                        machines={matrix.machines}
                        rows={matrix.rows}
                        onSelect={(row, cell) => {
                            setSelection({ row, cell })
                            setDetailOpen(true)
                        }}
                    />
                </div>
            )}

            <CompatibilityDetailDialog open={detailOpen} selection={selection} onOpenChange={setDetailOpen} />
        </div>
    )
}
