"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs"
import { ChartColumn, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { MOLD_STATS_DEFAULT_RANGE_DAYS } from "@core/helpers/production/moldStats"
import { formatDateKeyRange, isValidDateKey } from "@core/helpers/production/productionCalendar"
import { recentStatsRange } from "@core/helpers/production/productionStats"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { useMoldStats } from "@/features/production/stats/hooks/useMoldStats"
import { filterMoldStatsRows, type MoldStatsFilter } from "@/features/production/stats/lib/moldStatsFormat"
import { MoldStatsDetailDialog } from "./MoldStatsDetailDialog"
import { MoldStatsFilters } from "./MoldStatsFilters"
import { MoldStatsSummaryCards } from "./MoldStatsSummaryCards"
import { MoldStatsTable } from "./MoldStatsTable"
import { StatsErrorState } from "./StatsErrorState"

function filterText(filter: MoldStatsFilter): string {
    const parts = [
        filter.search.trim() ? `arama "${filter.search.trim()}"` : null,
        filter.onlySuggestions ? "çevrim önerisi olanlar" : null,
        filter.onlyMaintenance ? "bakım uyarısı olanlar" : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : "tüm kalıplar"
}

/**
 * Kalıp istatistikleri (Faz 5.3): sayaç ve bakım, gerçek çevrim ↔ plan, makine kartına çevrim
 * önerisi. Süzgeçler ve açık kalıp URL'de (paylaşılabilir). Hesap ve öneri kuralı sunucuda
 * (`core/helpers/production/moldStats.ts`); karta yazma planlayıcının onayıyla.
 */
export function MoldStatsPageClient() {
    const [{ q, oneri, bakim, bas, bit, kalip }, setState] = useQueryStates({
        q: parseAsString.withDefault(""),
        oneri: parseAsBoolean.withDefault(false),
        bakim: parseAsBoolean.withDefault(false),
        bas: parseAsString,
        bit: parseAsString,
        kalip: parseAsString,
    })
    const now = useNow()
    const today = productionDateKey(now)
    const defaults = recentStatsRange(now, MOLD_STATS_DEFAULT_RANGE_DAYS)
    const from = bas && isValidDateKey(bas) ? bas : defaults.from
    const to = bit && isValidDateKey(bit) && bit >= from ? bit : defaults.to
    const [exporting, setExporting] = useState(false)

    const statsQuery = useMoldStats({ from, to })
    const stats = statsQuery.data ?? null
    const filter: MoldStatsFilter = useMemo(() => ({ search: q, onlySuggestions: oneri, onlyMaintenance: bakim }), [q, oneri, bakim])
    const rows = useMemo(() => (stats ? filterMoldStatsRows(stats.rows, filter) : []), [stats, filter])
    const selected = stats && kalip ? stats.rows.find((row) => row.moldId === kalip) ?? null : null
    const isBackgroundRefetch = statsQuery.isFetching && Boolean(stats)
    const hasFilter = Boolean(q.trim()) || oneri || bakim

    async function exportExcel() {
        if (!stats) return
        setExporting(true)
        try {
            const { buildMoldStatsWorkbook, downloadWorkbook } = await import("@/features/production/stats/lib/moldStatsWorkbook")
            const { buffer, fileName } = await buildMoldStatsWorkbook(stats, rows, filterText(filter))
            downloadWorkbook(buffer as ArrayBuffer, fileName)
        } catch {
            toast.error("Excel dosyası oluşturulamadı")
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<ChartColumn />}
                title="Kalıp İstatistikleri"
                description="Her kalıbın baskı sayacı ve bakım durumu, seçilen aralıkta basılanlar ve gerçek çevrimin plandan farkı. Bir makinede gerçek çevrim karttakinden belirgin farklıysa kartı tek tıkla güncelleyebilirsiniz."
                action={(
                    <Button type="button" variant="outline" className="rounded-2xl" disabled={!stats || rows.length === 0 || exporting} onClick={() => void exportExcel()}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel&apos;e aktar
                    </Button>
                )}
            />

            <MoldStatsFilters
                search={q}
                onlySuggestions={oneri}
                onlyMaintenance={bakim}
                from={from}
                to={to}
                today={today}
                onSearchChange={(search) => void setState({ q: search || null })}
                onToggleSuggestions={() => void setState({ oneri: oneri ? null : true })}
                onToggleMaintenance={() => void setState({ bakim: bakim ? null : true })}
                onRangeChange={(range) => void setState({
                    bas: range.from === defaults.from && range.to === defaults.to ? null : range.from,
                    bit: range.from === defaults.from && range.to === defaults.to ? null : range.to,
                })}
            />

            {!stats && statsQuery.isError ? (
                <StatsErrorState
                    onRetry={() => void statsQuery.refetch()}
                    retrying={statsQuery.isFetching}
                    onClearFilters={bas || bit ? () => void setState({ bas: null, bit: null }) : undefined}
                />
            ) : !stats ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-72 rounded-2xl" />
                </div>
            ) : stats.rows.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><ChartColumn /></EmptyMedia>
                        <EmptyTitle>Henüz kalıp tanımlanmamış</EmptyTitle>
                        <EmptyDescription>Kalıplar tanımlanıp vardiya raporları girildikçe istatistikler burada görünür.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild variant="outline"><Link href="/uretim/kaliplar">Kalıplara git</Link></Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="relative space-y-6" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <p className="text-xs text-muted-foreground">{formatDateKeyRange(stats.range.from, stats.range.to)}</p>
                    <MoldStatsSummaryCards summary={stats.summary} />
                    {rows.length === 0 ? (
                        <Empty className="border">
                            <EmptyHeader>
                                <EmptyTitle>Süzgece uyan kalıp yok</EmptyTitle>
                                <EmptyDescription>{`Süzgeç: ${filterText(filter)}.`}</EmptyDescription>
                            </EmptyHeader>
                            {hasFilter ? (
                                <EmptyContent>
                                    <Button type="button" variant="outline" onClick={() => void setState({ q: null, oneri: null, bakim: null })}>Süzgeçleri temizle</Button>
                                </EmptyContent>
                            ) : null}
                        </Empty>
                    ) : (
                        <MoldStatsTable rows={rows} onOpen={(moldId) => void setState({ kalip: moldId })} />
                    )}
                    <p className="text-xs leading-5 text-muted-foreground">
                        Gerçek çevrim, aralıkta başlayan raporlu vardiyalarda (süre − kayıtlı duruş) ÷ baskı; duruşlar planda makine verimiyle karşılandığı için
                        çevrime girmez. Toplam baskı ve bakım bugünkü değerdir; bakım öngörüsü açık işlerin henüz basılmamış baskısını da sayar.
                    </p>
                </div>
            )}

            <MoldStatsDetailDialog row={selected} onOpenChange={(open) => { if (!open) void setState({ kalip: null }) }} />
        </div>
    )
}
