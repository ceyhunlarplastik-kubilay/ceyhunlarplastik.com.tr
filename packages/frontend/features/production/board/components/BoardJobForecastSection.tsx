"use client"

import { AlertTriangle, ArrowRightToLine, Wrench } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { FORECAST_STATE_LABELS, type ForecastState } from "@core/helpers/production/jobForecast"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { formatDurationMinutes, formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { BoardJob } from "@/features/production/board/api/types"
import {
    canPushFollowers,
    describeMaintenance,
    plannedFollowersOnBoard,
} from "@/features/production/board/utils/boardForecast"

const FORECAST_BADGE_CLASSES: Record<ForecastState, string> = {
    DONE: "",
    PRODUCED: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    ON_TRACK: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    NOT_STARTED: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    BEHIND: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    OVERDUE: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
}

type Props = {
    job: BoardJob
    machineCode: string
    /** Tahtadaki işler — onayda bu işten sonra planlı olanlar listelenir. */
    boardJobs: BoardJob[]
    isPushing: boolean
    onPushFollowers: (job: BoardJob) => void
}

/**
 * İş ayrıntısında planlanan ↔ gerçekleşen (4.3): rapordan ilerleme, tahmini bitiş, gecikme,
 * termin riski, kalıp bakımı. Geciken sahadaki işte "sonraki işleri kaydır" önerisi.
 */
export function BoardJobForecastSection({ job, machineCode, boardJobs, isPushing, onPushFollowers }: Props) {
    const { forecast, moldMaintenance } = job
    const percent = Math.floor(forecast.progress * 100)
    const producing = forecast.state !== "DONE" && forecast.state !== "PRODUCED"
    const earliestDue = job.outputs.map((output) => output.order?.dueDate ?? null).filter((date): date is string => Boolean(date)).sort()[0] ?? null
    const canPush = canPushFollowers(job)
    const followers = canPush ? plannedFollowersOnBoard(job, boardJobs) : []
    const delay = forecast.delayMinutes === null ? "—" : forecast.delayMinutes < 1 ? "yok" : `+${formatDurationMinutes(forecast.delayMinutes)}`
    const projected = forecast.projectedEndAt ? formatProductionShortDateTime(forecast.projectedEndAt) : "hesaplanamadı"

    return (
        <section className="space-y-3 rounded-2xl border p-4" aria-label="Gerçekleşen ve tahmin">
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">Gerçekleşen ve tahmin</h3>
                <Badge variant="outline" className={cn("rounded-full", FORECAST_BADGE_CLASSES[forecast.state])}>
                    {FORECAST_STATE_LABELS[forecast.state]}
                </Badge>
                {forecast.dueRisk ? (
                    <Badge variant="outline" className={cn("rounded-full", FORECAST_BADGE_CLASSES.OVERDUE)}>
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Termin riski
                    </Badge>
                ) : null}
            </div>

            <div className="space-y-1.5">
                <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                    <span className="text-muted-foreground">Raporlanan baskı</span>
                    <span className="font-medium tabular-nums">
                        %{percent} · {forecast.reportedShots.toLocaleString("tr-TR")} / {job.plannedShots.toLocaleString("tr-TR")}
                    </span>
                </div>
                <Progress value={percent} aria-label={`Raporlanan baskı %${percent}`} />
            </div>

            {producing ? (
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-muted-foreground">Planlı bitiş</dt>
                        <dd className="font-medium tabular-nums">{formatProductionShortDateTime(job.plannedEndAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-muted-foreground">Tahmini bitiş</dt>
                        <dd className="font-medium tabular-nums">{projected}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-muted-foreground">Gecikme</dt>
                        <dd className={cn("font-medium tabular-nums", forecast.delayMinutes && forecast.delayMinutes >= 1 && "text-red-700 dark:text-red-400")}>{delay}</dd>
                    </div>
                </dl>
            ) : null}

            {producing ? (
                <p className="text-xs text-muted-foreground">
                    Kalan {forecast.remainingShots.toLocaleString("tr-TR")} baskı plandaki çevrim ve verimle makinenin takvimine (vardiya, tatil,
                    duruş) yerleştirilerek tahmin edilir; raporlardaki sapma kalana yansır.
                    {earliestDue ? ` En yakın termin ${formatDateKey(earliestDue)}.` : ""}
                </p>
            ) : null}

            {moldMaintenance.level !== "NONE" ? (
                <p className="flex items-start gap-2 text-sm">
                    <Wrench className={cn("mt-0.5 h-4 w-4 shrink-0", moldMaintenance.level === "OK" && moldMaintenance.projectedLevel !== "DUE" ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400")} aria-hidden />
                    <span>
                        Kalıp {job.mold.code}: {describeMaintenance(moldMaintenance)}
                        {moldMaintenance.remainingShots !== null && moldMaintenance.remainingShots > 0
                            ? ` · bakıma ${moldMaintenance.remainingShots.toLocaleString("tr-TR")} baskı`
                            : ""}
                    </span>
                </p>
            ) : null}

            {canPush ? (
                <div className="flex flex-col gap-2 rounded-xl bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-xs text-muted-foreground sm:flex-1">
                        {machineCode} makinesinde bu işten sonra planlanan işler tahmini bitişin arkasına kaydırılabilir.
                    </p>
                    <ConfirmDeleteDialog
                        trigger={(
                            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" disabled={isPushing}>
                                <ArrowRightToLine className="h-4 w-4" />
                                Sonraki işleri tahmini bitişe kaydır
                            </Button>
                        )}
                        title="Sonraki işler kaydırılsın mı?"
                        description={`İş ${job.lotBaseNumber} tahminen ${projected} bitecek (planlı bitişten ${formatDurationMinutes(forecast.delayMinutes ?? 0)} geç). ${machineCode} makinesinde bu işten sonra planlanan işler bu anın arkasına sırayla kaydırılır: aradaki boşluk korunur, değmeyen iş yerinde kalır. Tahmin sunucuda yeniden hesaplanır.${followers.length === 0 ? " Bu pencerede görünen planlı iş yok; pencere dışındakiler de değerlendirilir." : ""}`}
                        itemNames={followers.map((follower) => `İş ${follower.lotBaseNumber} · ${formatProductionShortDateTime(follower.setupStartAt)}`)}
                        confirmLabel="Kaydır"
                        onConfirm={() => onPushFollowers(job)}
                    />
                </div>
            ) : job.status === "PLANNED" && (forecast.state === "NOT_STARTED" || forecast.state === "OVERDUE") ? (
                <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Planlı iş zamanında başlamadı: aşağıdaki Taşı formuyla ya da tahtada sürükleyerek yeniden planlayın.
                </p>
            ) : null}
        </section>
    )
}
