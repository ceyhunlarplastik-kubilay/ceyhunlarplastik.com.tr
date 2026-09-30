"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsString, useQueryStates } from "nuqs"
import { ChevronLeft, ChevronRight, ClipboardCheck, ClipboardPen, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { addDaysToDateKey, formatDateKey, isValidDateKey, weekdayOfDateKey } from "@core/helpers/production/productionCalendar"
import { formatDurationMinutes, formatProductionShortDateTime, productionDateKey } from "@core/helpers/production/productionTime"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import type { LotListItem } from "@/features/production/lots/api/types"
import { LotDisplayStatusBadge } from "@/features/production/lots/components/LotDisplayStatusBadge"
import { LotReportDialog } from "@/features/production/lots/components/LotReportDialog"
import { StartLotButton } from "@/features/production/lots/components/StartLotButton"
import { useProductionLots } from "@/features/production/lots/hooks/useProductionLots"
import { canReportLot, canStartLot, lotTotals } from "@/features/production/lots/utils/lotExecution"
import { formatLotTimeRange, lotDetailPath, lotPlannedQuantity } from "@/features/production/lots/utils/lotFormat"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"

/** Bir günde en fazla bu kadar lot (makine × vardiya); fazlası için Lotlar sayfası. */
const DAY_LIMIT = 100

type MachineGroup = { machine: LotListItem["job"]["machine"]; lots: LotListItem[] }

function groupByMachine(lots: LotListItem[]): MachineGroup[] {
    const groups = new Map<string, MachineGroup>()
    for (const lot of lots) {
        const group = groups.get(lot.job.machine.id) ?? { machine: lot.job.machine, lots: [] }
        group.lots.push(lot)
        groups.set(lot.job.machine.id, group)
    }
    return [...groups.values()].sort((a, b) => a.machine.code.localeCompare(b.machine.code, "tr"))
}

/**
 * Vardiya raporu (saha girişi, planlayıcı operatör adına): seçilen günün lotları makine başına.
 * Rapor lotu kapatır ve sıradaki lotu başlatır; "Başlat" anlık izlemek isteyenler için.
 */
export function ShiftReportPageClient() {
    const [{ gun }, setState] = useQueryStates({ gun: parseAsString })
    const today = productionDateKey(useNow())
    const date = gun && isValidDateKey(gun) ? gun : today
    const lotsQuery = useProductionLots({ page: 1, limit: DAY_LIMIT, from: date, to: date, machineId: "", q: "" })
    const [reporting, setReporting] = useState<string | null>(null)

    const lots = useMemo(() => lotsQuery.data?.data ?? [], [lotsQuery.data])
    const groups = useMemo(() => groupByMachine(lots), [lots])
    const pending = lots.filter((lot) => canReportLot(lot) && !lot.reportedAt).length
    const isInitialLoading = lotsQuery.isLoading && !lotsQuery.data

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<ClipboardPen />}
                title="Vardiya Raporu"
                description="Günün lotları makine başına. Vardiya sonunda sağlam / fire, fire nedenleri ve duruşları girin: rapor lotu kapatır, sıradaki lot kendiliğinden başlar. İş tamamlanana kadar rapor düzeltilebilir."
            />

            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Önceki gün" onClick={() => void setState({ gun: addDaysToDateKey(date, -1) })}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" disabled={date === today} onClick={() => void setState({ gun: null })}>Bugün</Button>
                <Button type="button" variant="outline" disabled={date === addDaysToDateKey(today, -1)} onClick={() => void setState({ gun: addDaysToDateKey(today, -1) })}>Dün</Button>
                <Button type="button" variant="outline" size="icon" aria-label="Sonraki gün" onClick={() => void setState({ gun: addDaysToDateKey(date, 1) })}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Input
                    type="date"
                    value={date}
                    onChange={(event) => { if (isValidDateKey(event.target.value)) void setState({ gun: event.target.value === today ? null : event.target.value }) }}
                    aria-label="Vardiya günü"
                    className="w-40"
                />
                <span className="text-sm font-medium">{formatDateKey(date)} {weekdayShortLabel(weekdayOfDateKey(date))}</span>
                {pending > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-amber-700 sm:ms-auto dark:text-amber-400">
                        <TriangleAlert className="h-4 w-4" />
                        {pending} lot rapor bekliyor
                    </span>
                ) : null}
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-72 rounded-2xl" />
            ) : lots.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">Bu vardiya gününde lot yok.</p>
            ) : (
                <div className="space-y-3">
                    <AdminListRefreshBar dataUpdatedAt={lotsQuery.dataUpdatedAt} isFetching={lotsQuery.isFetching} onRefresh={() => void lotsQuery.refetch()} />
                    <div className="relative space-y-3" aria-busy={lotsQuery.isFetching}>
                        <AdminSectionLoadingOverlay isVisible={lotsQuery.isFetching && !isInitialLoading} />
                        {groups.map((group) => (
                            <section key={group.machine.id} className="overflow-hidden rounded-2xl border bg-card" aria-label={group.machine.code}>
                                <h2 className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
                                    {group.machine.code} <span className="font-normal text-muted-foreground">· {group.machine.name}</span>
                                </h2>
                                <ul className="divide-y">
                                    {group.lots.map((lot) => <ShiftReportRow key={lot.id} lot={lot} onReport={() => setReporting(lot.lotNumber)} />)}
                                </ul>
                            </section>
                        ))}
                    </div>
                    {lotsQuery.data && lotsQuery.data.meta.total > DAY_LIMIT ? (
                        <p className="text-xs text-muted-foreground">
                            Bu günde {lotsQuery.data.meta.total} lot var; ilk {DAY_LIMIT} gösteriliyor — tamamı için <Link href={`/uretim/lotlar?bas=${date}&bit=${date}`} className="underline">Lotlar</Link>.
                        </p>
                    ) : null}
                </div>
            )}

            <LotReportDialog lotNumber={reporting} onOpenChange={(open) => { if (!open) setReporting(null) }} />
        </div>
    )
}

function ShiftReportRow({ lot, onReport }: { lot: LotListItem; onReport: () => void }) {
    const first = lot.outputs[0]
    const totals = lotTotals(lot)
    return (
        <li className="grid gap-2 px-4 py-3 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
            <div>
                <Link href={lotDetailPath(lot.lotNumber)} className="font-semibold tabular-nums underline-offset-4 hover:underline">{lot.lotNumber}</Link>
                <div className="text-xs tabular-nums text-muted-foreground">{lot.shiftCode} · {formatLotTimeRange(lot)}</div>
            </div>
            <div className="min-w-0 text-sm">
                <div className="truncate">{first?.productName} <span className="font-mono text-xs">{first?.order?.variantCode ?? first?.sizeCode}</span></div>
                <div className="text-xs text-muted-foreground">{lot.job.mold.code} · planlanan {lotPlannedQuantity(lot.outputs).toLocaleString("tr-TR")} adet</div>
            </div>
            <div className="text-sm">
                <LotDisplayStatusBadge lot={lot} />
                {lot.reportedAt ? (
                    <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                        Sağlam {totals.good.toLocaleString("tr-TR")} · fire {totals.scrap.toLocaleString("tr-TR")}
                        {lot.stopMinutes > 0 ? ` · duruş ${formatDurationMinutes(lot.stopMinutes)}` : ""}
                    </div>
                ) : lot.status === "RUNNING" && lot.actualStartAt ? (
                    <div className="mt-1 text-xs tabular-nums text-muted-foreground">Başladı {formatProductionShortDateTime(lot.actualStartAt)}</div>
                ) : null}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
                {canStartLot(lot) ? <StartLotButton lot={lot} /> : null}
                {canReportLot(lot) ? (
                    <Button type="button" size="sm" variant={lot.reportedAt ? "ghost" : "default"} onClick={onReport}>
                        <ClipboardCheck className="h-4 w-4" />
                        {lot.reportedAt ? "Düzelt" : "Rapor gir"}
                    </Button>
                ) : null}
            </div>
        </li>
    )
}
