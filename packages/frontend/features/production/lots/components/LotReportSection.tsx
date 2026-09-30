"use client"

import Link from "next/link"
import { ClipboardCheck, SquareKanban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { STOP_CATEGORY_LABELS } from "@core/helpers/production/productionReasons"
import { formatDurationMinutes, formatProductionDateTime, formatProductionTimeRange } from "@core/helpers/production/productionTime"
import type { LotDetail } from "@/features/production/lots/api/types"
import { canReportLot, canStartLot } from "@/features/production/lots/utils/lotExecution"
import { LotDisplayStatusBadge } from "./LotDisplayStatusBadge"
import { StartLotButton } from "./StartLotButton"

const minutesBetween = (start: string, end: string) => (new Date(end).getTime() - new Date(start).getTime()) / 60_000

/** Lotun vardiya raporu: gerçekleşen süre, baskı, duruşlar; başlat / rapor gir / düzelt. */
export function LotReportSection({ lot, onReport }: { lot: LotDetail; onReport: () => void }) {
    const allReported = lot.siblings.every((sibling) => sibling.reportedAt !== null)
    const jobOpen = lot.job.status !== "COMPLETED" && lot.job.status !== "CANCELLED"

    return (
        <section className="space-y-3 rounded-2xl border p-4">
            <header className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Vardiya raporu</h2>
                <LotDisplayStatusBadge lot={lot} />
                <div className="ms-auto flex gap-2">
                    {canStartLot(lot) ? <StartLotButton lot={lot} /> : null}
                    {canReportLot(lot) ? (
                        <Button type="button" size="sm" variant={lot.reportedAt ? "outline" : "default"} onClick={onReport}>
                            <ClipboardCheck className="h-4 w-4" />
                            {lot.reportedAt ? "Raporu düzelt" : "Rapor gir"}
                        </Button>
                    ) : null}
                </div>
            </header>

            {lot.job.status === "PLANNED" ? (
                <p className="text-sm text-muted-foreground">İş henüz sahaya verilmedi; rapor Durum Panosu&apos;nda sahaya verildikten sonra girilir.</p>
            ) : null}

            {lot.actualStartAt ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="text-xs text-muted-foreground">Gerçekleşen</dt>
                        <dd className="font-medium tabular-nums">
                            {lot.actualEndAt ? formatProductionTimeRange(lot.actualStartAt, lot.actualEndAt) : `${formatProductionDateTime(lot.actualStartAt)} – sürüyor`}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Süre (planlanan)</dt>
                        <dd className="font-medium tabular-nums">
                            {lot.actualEndAt ? formatDurationMinutes(minutesBetween(lot.actualStartAt, lot.actualEndAt)) : "—"}
                            <span className="font-normal text-muted-foreground"> ({formatDurationMinutes(minutesBetween(lot.plannedStartAt, lot.plannedEndAt))})</span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Baskı (planlanan)</dt>
                        <dd className="font-medium tabular-nums">
                            {lot.actualShots !== null ? lot.actualShots.toLocaleString("tr-TR") : "—"}
                            <span className="font-normal text-muted-foreground"> ({lot.plannedShots.toLocaleString("tr-TR")})</span>
                        </dd>
                    </div>
                </dl>
            ) : lot.job.status !== "PLANNED" ? (
                <p className="text-sm text-muted-foreground">Rapor girilmedi.</p>
            ) : null}

            {lot.stops.length > 0 ? (
                <div className="space-y-1.5">
                    <h3 className="text-xs font-medium text-muted-foreground">Duruşlar · toplam {formatDurationMinutes(lot.stopMinutes)}</h3>
                    <ul className="space-y-1 text-sm">
                        {lot.stops.map((stop) => (
                            <li key={stop.id} className="flex flex-wrap gap-x-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                                <span className="font-medium">{stop.reason.code} · {stop.reason.name}</span>
                                {stop.reason.stopCategory ? <span className="text-muted-foreground">{STOP_CATEGORY_LABELS[stop.reason.stopCategory]}</span> : null}
                                <span className="tabular-nums">{formatDurationMinutes(stop.durationMinutes)}</span>
                                {stop.startAt ? <span className="tabular-nums text-muted-foreground">{formatProductionDateTime(stop.startAt).slice(11)}&apos;de</span> : null}
                                {stop.note ? <span className="text-muted-foreground">— {stop.note}</span> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {lot.reportedAt ? (
                <p className="text-xs text-muted-foreground">
                    {formatProductionDateTime(lot.reportedAt)} · {lot.reportedBy ? [lot.reportedBy.firstName, lot.reportedBy.lastName].filter(Boolean).join(" ") || "Kullanıcı" : "Silinmiş kullanıcı"} girdi.
                </p>
            ) : null}

            {allReported && jobOpen ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    İş {lot.job.lotBaseNumber}&apos;in tüm lotları raporlandı — işi tamamlayın (adetler raporların toplamıyla dolu gelir).
                    <Button asChild size="sm" variant="outline" className="ms-auto">
                        <Link href="/uretim/pano"><SquareKanban className="h-4 w-4" />Durum Panosu</Link>
                    </Button>
                </div>
            ) : null}
        </section>
    )
}
