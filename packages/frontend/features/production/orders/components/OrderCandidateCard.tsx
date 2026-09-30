"use client"

import type { ReactNode } from "react"
import { CalendarPlus, ChevronDown, CircleCheck, CircleX, Loader2, Star, ThumbsUp, TriangleAlert, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import {
    formatProductionDateTime,
    formatProductionShortDateTime,
    formatWorkMinutes,
} from "@core/helpers/production/productionTime"
import type { OrderCandidate } from "@/features/production/orders/api/types"
import { candidateNoteSummary, splitCandidateNote } from "@/features/production/orders/utils/candidateNotes"
import { jobCalendarDays } from "@/features/production/shared/jobDurations"
import { cn } from "@/lib/utils"

const CYCLE_SOURCE_LABELS: Record<OrderCandidate["cycleSource"], string> = {
    order: "emirden",
    machineCard: "makine kartından",
    mold: "kalıptan",
}

function formatMoney(value: number, currency: string) {
    return value.toLocaleString("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 })
}

type Props = {
    candidate: OrderCandidate
    horizonDays: number
    canPlan: boolean
    isPlanning: boolean
    planBusy: boolean
    onPlan: (candidate: OrderCandidate) => void
}

/**
 * Plan önizlemesinde bir makine × kalıp adayı. Tablo yerine kart: sütunlar kabın genişliğine göre dizilir,
 * yatay kaydırma olmaz; uygunluk uyarıları tek satırlık özet, ayrıntısı açılınca.
 */
export function OrderCandidateCard({ candidate, horizonDays, canPlan, isPlanning, planBusy, onPlan }: Props) {
    const notes = candidate.notes.map(splitCandidateNote)
    const calendar = candidate.setupStartAt && candidate.endAt ? jobCalendarDays(candidate.setupStartAt, candidate.endAt) : null

    return (
        <li
            className={cn(
                "rounded-2xl border p-4",
                candidate.isEarliest && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">{candidate.machine.code}</span>
                        <span className="text-sm text-muted-foreground">{candidate.machine.name}</span>
                        {candidate.isEarliest ? (
                            <Badge variant="outline" className="gap-1 rounded-full border-emerald-300 text-emerald-700 dark:text-emerald-300">
                                <Zap className="h-3 w-3" aria-hidden />En erken
                            </Badge>
                        ) : null}
                        {candidate.isCheapest ? (
                            <Badge variant="outline" className="gap-1 rounded-full border-sky-300 text-sky-700 dark:text-sky-300">
                                <Star className="h-3 w-3" aria-hidden />En ekonomik
                            </Badge>
                        ) : null}
                        {candidate.isPreferred ? (
                            <Badge variant="outline" className="gap-1 rounded-full text-muted-foreground">
                                <ThumbsUp className="h-3 w-3 text-sky-600" aria-hidden />Tercih edilen
                            </Badge>
                        ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {candidate.mold.code} · {candidate.mold.name} · {candidate.cavities} göz · {candidate.shots.toLocaleString("tr-TR")} baskı
                    </div>
                </div>
                <Button
                    type="button"
                    size="sm"
                    className="rounded-2xl"
                    disabled={!canPlan || !candidate.endAt || planBusy}
                    title={canPlan ? undefined : "Emir zaten planlı ya da kapanmış"}
                    onClick={() => onPlan(candidate)}
                >
                    {isPlanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                    Planla
                </Button>
            </div>

            <dl className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-3 gap-y-3 text-sm">
                <Metric label="Çevrim" value={`${candidate.cycleTimeSec.toLocaleString("tr-TR")} sn`} hint={CYCLE_SOURCE_LABELS[candidate.cycleSource]} />
                {/* Çalışma süresi saatle ("34 sa 6 dk"); günle yazmak 12 saatlik günlerde işi kısa gösteriyordu. */}
                <Metric
                    label="Çalışma süresi"
                    value={formatWorkMinutes(candidate.setupMinutes + candidate.productionMinutes)}
                    hint={`bağlama ${candidate.setupMinutes} dk${calendar ? ` · takvimde ${calendar.days} gün` : ""}`}
                />
                <Metric label="Başlangıç" value={candidate.setupStartAt ? formatProductionDateTime(candidate.setupStartAt) : "—"} />
                <Metric
                    label="Bitiş"
                    value={candidate.endAt ? (
                        formatProductionDateTime(candidate.endAt)
                    ) : (
                        <span className="text-red-600 dark:text-red-400">{horizonDays} gün içinde bitmiyor</span>
                    )}
                />
                <Metric
                    label="Termin"
                    value={candidate.meetsDueDate === null ? (
                        <span className="text-muted-foreground">—</span>
                    ) : candidate.meetsDueDate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><CircleCheck className="h-4 w-4" aria-hidden />Yetişir</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><CircleX className="h-4 w-4" aria-hidden />Gecikir</span>
                    )}
                />
                <Metric label="Makine maliyeti" value={candidate.machineCost != null ? formatMoney(candidate.machineCost, candidate.currency) : "—"} />
            </dl>

            {candidate.missingShiftPattern ? (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">Vardiya düzeni yok — makine çalışmıyor sayıldı.</p>
            ) : null}

            {notes.length > 0 || candidate.lots.length > 0 ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                    {notes.length > 0 ? (
                        <Collapsible>
                            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-start text-xs text-amber-800 outline-none hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-ring dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50">
                                <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                <span className="shrink-0 font-medium">{notes.length} uyarı</span>
                                <span className="min-w-0 flex-1 truncate">{candidateNoteSummary(notes)}</span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <ul className="mt-1.5 space-y-1 ps-2.5 text-xs">
                                    {notes.map((note, index) => (
                                        <li key={`${note.title}:${index}`}>
                                            <span className="font-medium text-amber-800 dark:text-amber-300">{note.title}</span>
                                            {note.detail ? <span className="text-muted-foreground"> — {note.detail}</span> : null}
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                    ) : null}

                    {candidate.lots.length > 0 ? (
                        <Collapsible>
                            <CollapsibleTrigger className="group inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                                {candidate.lots.length} vardiya lotu
                                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <p className="mt-1.5 text-xs text-muted-foreground">Planla ile lot numarası alır (kök-1, kök-2…).</p>
                                <ul className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-1 text-xs">
                                    {candidate.lots.map((lot) => (
                                        <li key={lot.sequence} className="flex flex-wrap items-center gap-x-2 rounded-lg bg-muted/50 px-2 py-1">
                                            <span className="font-medium">Lot {lot.sequence}</span>
                                            <span className="text-muted-foreground">{formatDateKey(lot.workday)} · {lot.shiftCode}</span>
                                            <span className="tabular-nums">
                                                {formatProductionShortDateTime(lot.startAt).slice(6)}–{formatProductionShortDateTime(lot.endAt).slice(6)}
                                            </span>
                                            <span className="ms-auto tabular-nums">{lot.quantity.toLocaleString("tr-TR")} adet</span>
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                    ) : null}
                </div>
            ) : null}
        </li>
    )
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
            {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
        </div>
    )
}
