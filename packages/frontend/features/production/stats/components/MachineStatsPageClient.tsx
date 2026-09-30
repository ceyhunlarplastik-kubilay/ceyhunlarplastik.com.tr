"use client"

import { useState } from "react"
import Link from "next/link"
import { parseAsString, useQueryStates } from "nuqs"
import { FileSpreadsheet, Gauge } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { MACHINE_STATS_DEFAULT_RANGE_DAYS } from "@core/helpers/production/machineStats"
import { formatDateKeyRange, isValidDateKey } from "@core/helpers/production/productionCalendar"
import { recentStatsRange } from "@core/helpers/production/productionStats"
import { formatProductionShortDateTime, productionDateKey } from "@core/helpers/production/productionTime"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import type { MachineStats } from "@/features/production/stats/api/types"
import { useMachineStats } from "@/features/production/stats/hooks/useMachineStats"
import { MachineStatsCharts } from "./MachineStatsCharts"
import { MachineStatsFilters } from "./MachineStatsFilters"
import { MachineStatsSummaryCards } from "./MachineStatsSummaryCards"
import { MachineStatsTable } from "./MachineStatsTable"
import { StatsErrorState } from "./StatsErrorState"

function areaLabel(stats: MachineStats): string | null {
    const area = stats.areaId ? stats.areas.find((entry) => entry.id === stats.areaId) : null
    return area ? `${area.code} · ${area.name}` : null
}

/** Ekranın altındaki kısa tanımlar — sayılar nereden geliyor. */
function MachineStatsNotes() {
    return (
        <ul className="list-disc space-y-1 ps-5 text-xs leading-5 text-muted-foreground">
            <li><span className="font-medium text-foreground">Kullanım:</span> vardiya süresinin raporlu üretimde geçen kısmı. Vardiya süresi makinenin vardiya düzeninden, tatil ve toplu izin günleri düşülerek.</li>
            <li><span className="font-medium text-foreground">OEE</span> = kullanılabilirlik × performans × kalite; yalnız raporlu vardiyalardan. Kullanılabilirlik: net çalışma ÷ (vardiya raporundaki süre − planlı duruş). Performans: plandaki çevrimle gereken süre ÷ net çalışma. Kalite: sağlam ÷ (sağlam + fire).</li>
            <li><span className="font-medium text-foreground">Makine duruşu:</span> Makineler sayfasındaki bakım / arıza kayıtlarının vardiyaya düşen, üretimle çakışmayan kısmı; OEE&apos;ye girmez.</li>
            <li><span className="font-medium text-foreground">Boş:</span> planlanmamış ya da raporu girilmemiş vardiya süresi. Süren vardiya rapor girilince sayılır.</li>
        </ul>
    )
}

/**
 * Makine kullanımı ve OEE (Faz 5.2): alan + tarih süzgeçli, makine başına zaman dağılımı ve OEE.
 * Süzgeçler URL'de (paylaşılabilir). Hesap sunucuda (`core/helpers/production/machineStats.ts`);
 * burada gösterim ve Excel.
 */
export function MachineStatsPageClient() {
    const [{ alan, bas, bit }, setState] = useQueryStates({
        alan: parseAsString.withDefault(""),
        bas: parseAsString,
        bit: parseAsString,
    })
    const now = useNow()
    const today = productionDateKey(now)
    const defaults = recentStatsRange(now, MACHINE_STATS_DEFAULT_RANGE_DAYS)
    const from = bas && isValidDateKey(bas) ? bas : defaults.from
    const to = bit && isValidDateKey(bit) && bit >= from ? bit : defaults.to
    const [exporting, setExporting] = useState(false)

    const statsQuery = useMachineStats({ areaId: alan, from, to })
    const stats = statsQuery.data ?? null
    const isBackgroundRefetch = statsQuery.isFetching && Boolean(stats)
    const hasReports = Boolean(stats && (stats.totals.report.reportedLotCount > 0 || stats.totals.time.productionMinutes > 0))

    async function exportExcel() {
        if (!stats) return
        setExporting(true)
        try {
            const { buildMachineStatsWorkbook, downloadWorkbook } = await import("@/features/production/stats/lib/machineStatsWorkbook")
            const { buffer, fileName } = await buildMachineStatsWorkbook(stats, areaLabel(stats))
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
                icon={<Gauge />}
                title="Makine Kullanımı ve OEE"
                description="Her makinenin vardiya süresinin nereye gittiği (üretim, duruş, makine duruşu, boş) ve OEE: kullanılabilirlik × performans × kalite. OEE yalnız vardiya raporu girilmiş vardiyalardan hesaplanır."
                action={(
                    <Button type="button" variant="outline" className="rounded-2xl" disabled={!stats || stats.rows.length === 0 || exporting} onClick={() => void exportExcel()}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel&apos;e aktar
                    </Button>
                )}
            />

            <MachineStatsFilters
                areas={stats?.areas ?? []}
                areaId={alan}
                from={from}
                to={to}
                today={today}
                onAreaChange={(areaId) => void setState({ alan: areaId })}
                onRangeChange={(range) => void setState({
                    bas: range.from === defaults.from && range.to === defaults.to ? null : range.from,
                    bit: range.from === defaults.from && range.to === defaults.to ? null : range.to,
                })}
            />

            {!stats && statsQuery.isError ? (
                <StatsErrorState
                    onRetry={() => void statsQuery.refetch()}
                    retrying={statsQuery.isFetching}
                    onClearFilters={alan || bas || bit ? () => void setState({ alan: null, bas: null, bit: null }) : undefined}
                />
            ) : !stats ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-72 rounded-2xl" />
                </div>
            ) : stats.rows.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><Gauge /></EmptyMedia>
                        <EmptyTitle>{alan ? "Bu alanda makine yok" : "Henüz makine tanımlanmamış"}</EmptyTitle>
                        <EmptyDescription>
                            {alan ? "Başka bir alan seçin ya da süzgeci kaldırın." : "Makineler ve vardiya düzenleri tanımlandıkça kullanım burada görünür."}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        {alan ? (
                            <Button type="button" variant="outline" onClick={() => void setState({ alan: null })}>Tüm alanlar</Button>
                        ) : (
                            <Button asChild variant="outline"><Link href="/uretim/makineler">Makinelere git</Link></Button>
                        )}
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="relative space-y-6" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <p className="text-xs text-muted-foreground">
                        {formatDateKeyRange(stats.range.from, stats.range.to)}
                        {stats.range.to >= today ? ` · ${formatProductionShortDateTime(stats.range.endAt)} itibarıyla` : ""}
                        {areaLabel(stats) ? ` · ${areaLabel(stats)}` : " · Tüm alanlar"}
                    </p>
                    {hasReports ? null : (
                        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            Bu aralıkta vardiya raporu yok. Kullanım ve OEE vardiya raporlarından hesaplanır (Saha → Vardiya Raporu).
                        </p>
                    )}
                    <MachineStatsSummaryCards totals={stats.totals} />
                    <MachineStatsCharts rows={stats.rows} stopReasons={stats.stopReasons} />
                    <MachineStatsTable rows={stats.rows} totals={stats.totals} />
                    <MachineStatsNotes />
                </div>
            )}
        </div>
    )
}
