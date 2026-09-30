"use client"

import { useDraggable } from "@dnd-kit/core"
import { AlertTriangle, Wrench } from "lucide-react"

import { cn } from "@/lib/utils"
import { isForecastAlert } from "@core/helpers/production/jobForecast"
import { isMaintenanceAlert } from "@core/helpers/production/moldMaintenance"
import { formatProductionTimeRange } from "@core/helpers/production/productionTime"
import type { BoardJob } from "@/features/production/board/api/types"
import {
    actualLotSpans,
    describeForecast,
    describeMaintenance,
    progressLabel,
    projectedDelaySpan,
} from "@/features/production/board/utils/boardForecast"
import {
    isJobMovable,
    jobLabel,
    jobSegments,
    spanPercent,
    toSpan,
    type DragPreview,
    type TimeSpan,
} from "@/features/production/board/utils/boardGeometry"
import { JOB_STATUS_BORDER_CLASSES, JOB_STATUS_FILL_CLASSES, JOB_STATUS_LABELS } from "@/features/production/shared/jobStatus"
import { ACTUAL_LINE_CLASS, PROJECTED_DELAY_CLASS } from "./boardStyles"

const PREVIEW_CLASSES: Record<DragPreview["verdict"], string> = {
    same: "bg-foreground text-background",
    ok: "bg-emerald-600 text-white",
    unknown: "bg-amber-500 text-white",
    warning: "bg-amber-500 text-white",
    error: "bg-red-600 text-white",
}

type Props = {
    job: BoardJob
    range: TimeSpan
    /** Üretimdeki lotun gerçekleşen hattı şimdiye kadar çizilir. */
    now: Date
    onSelect: (job: BoardJob) => void
    canDrag: boolean
    isPending: boolean
    /** Yalnız sürüklenen çubukta: hedef makine + saat etiketi. */
    dragPreview: DragPreview | null
}

/**
 * İş çubuğu: bağlamadan planlı bitişe ince bir hat; üstünde kesikli bağlama bloğu ve dolu
 * vardiya lotları (aradaki vardiya dışı zaman boş). Soldaki şerit ürün rengi. Planlı iş
 * sürüklenebilir; sürüklerken üstünde hedef etiketi görünür.
 *
 * Planlanan ↔ gerçekleşen (4.3): alt kenardaki koyu hat gerçekleşen üretim (raporlu lotlar,
 * üretimdeki lot şimdiye kadar); planlı bitişin sağındaki taralı uzantı tahmini gecikme. İkisi
 * satıra göre konumlanır (çubuğun dışına taşabilir). Etikette ilerleme ve uyarı ikonları.
 */
export function BoardJobBar({ job, range, now, onSelect, canDrag, isPending, dragPreview }: Props) {
    const movable = canDrag && isJobMovable(job) && !isPending
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id, disabled: !movable })

    const jobSpan = toSpan(job.setupStartAt, job.plannedEndAt)
    // Planlı aralık pencere dışında kalabilir (geciken iş): o zaman yalnız uzantı ve hat çizilir.
    const position = spanPercent(range, jobSpan)
    // Parçalar çubuğun GÖRÜNEN kısmına göre konumlanır (pencere dışına taşan iş kırpılır).
    const visible = { startMs: Math.max(jobSpan.startMs, range.startMs), endMs: Math.min(jobSpan.endMs, range.endMs) }

    const label = jobLabel(job)
    const progress = progressLabel(job)
    const forecastAlert = isForecastAlert(job.forecast)
    const maintenanceAlert = isMaintenanceAlert(job.moldMaintenance)
    const delaySpan = isDragging ? null : projectedDelaySpan(job)
    const delayPosition = delaySpan ? spanPercent(range, delaySpan) : null
    const actualPositions = isDragging
        ? []
        : actualLotSpans(job, now).flatMap((span) => {
            const actual = spanPercent(range, span)
            return actual ? [{ key: span.startMs, ...actual }] : []
        })
    const description = [
        label,
        JOB_STATUS_LABELS[job.status],
        formatProductionTimeRange(job.setupStartAt, job.plannedEndAt),
        progress ? `${progress} raporlandı` : null,
        forecastAlert || delaySpan ? describeForecast(job.forecast) : null,
        maintenanceAlert ? `Kalıp ${job.mold.code}: ${describeMaintenance(job.moldMaintenance)}` : null,
        movable ? "sürükleyerek taşıyın" : null,
    ].filter(Boolean).join(" · ")

    return (
        <>
            {delayPosition ? (
                <span
                    className={cn("pointer-events-none absolute inset-y-2 z-[7] rounded-e-md", PROJECTED_DELAY_CLASS)}
                    style={{ left: `${delayPosition.left}%`, width: `${delayPosition.width}%` }}
                    title={describeForecast(job.forecast)}
                    aria-hidden
                />
            ) : null}
            {position ? (
                <button
                    ref={setNodeRef}
                    type="button"
                    {...attributes}
                    {...listeners}
                    onClick={() => onSelect(job)}
                    className={cn(
                        "group absolute inset-y-2 z-[6] min-w-1.5 rounded-md text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        movable && "cursor-grab touch-none",
                        isDragging && "z-30 cursor-grabbing opacity-90 shadow-lg",
                        isPending && "animate-pulse opacity-60",
                    )}
                    style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                    }}
                    title={description}
                    aria-label={description}
                >
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/30" aria-hidden />
                    {jobSegments(job).map((segment) => {
                        const inner = spanPercent(visible, segment)
                        if (!inner) return null
                        return (
                            <span
                                key={segment.kind === "lot" ? segment.lotNumber : "setup"}
                                className={cn(
                                    "absolute inset-y-0 rounded-sm border group-hover:brightness-95",
                                    JOB_STATUS_BORDER_CLASSES[job.status],
                                    segment.kind === "setup" ? "border-dashed bg-background/70" : JOB_STATUS_FILL_CLASSES[job.status],
                                )}
                                style={{ left: `${inner.left}%`, width: `${inner.width}%` }}
                                aria-hidden
                            />
                        )
                    })}
                    {job.colorHex ? (
                        <span
                            className="absolute inset-y-0 start-0 w-1 rounded-s-md ring-1 ring-foreground/20"
                            style={{ backgroundColor: job.colorHex }}
                            aria-hidden
                        />
                    ) : null}
                    <span className="pointer-events-none relative flex min-w-0 items-center gap-1 px-2 text-[11px] font-medium leading-[2.75rem] text-foreground">
                        {forecastAlert ? <AlertTriangle className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" aria-hidden /> : null}
                        {maintenanceAlert ? <Wrench className="h-3 w-3 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden /> : null}
                        <span className="truncate">{progress ? <span className="tabular-nums">{progress} · </span> : null}{label}</span>
                    </span>
                    {dragPreview ? (
                        <span
                            className={cn(
                                "pointer-events-none absolute -top-6 start-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium shadow",
                                PREVIEW_CLASSES[dragPreview.verdict],
                            )}
                        >
                            {dragPreview.label}
                        </span>
                    ) : null}
                </button>
            ) : null}
            {actualPositions.map((actual) => (
                <span
                    key={actual.key}
                    className={cn("pointer-events-none absolute bottom-2.5 z-[7] h-1", ACTUAL_LINE_CLASS)}
                    style={{ left: `${actual.left}%`, width: `${actual.width}%` }}
                    aria-hidden
                />
            ))}
        </>
    )
}
