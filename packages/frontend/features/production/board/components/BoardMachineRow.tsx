"use client"

import { useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatProductionTimeRange } from "@core/helpers/production/productionTime"
import type { BoardDowntime, BoardJob, BoardMachine } from "@/features/production/board/api/types"
import {
    offShiftSpans,
    spanPercent,
    toSpan,
    type BoardDay,
    type DragPreview,
    type MoveVerdict,
    type TimeSpan,
} from "@/features/production/board/utils/boardGeometry"
import { CALENDAR_EXCEPTION_KIND_LABELS } from "@/features/production/shared/calendarExceptionKinds"
import { DOWNTIME_KIND_LABELS } from "@/features/production/shared/downtimeKinds"
import { MACHINE_STATUS_BADGE_CLASSES, MACHINE_STATUS_LABELS } from "@/features/production/shared/machineStatus"
import { BoardJobBar } from "./BoardJobBar"
import { DOWNTIME_PATTERN_CLASS, OFF_SHIFT_CLASS } from "./boardStyles"

type Props = {
    machine: BoardMachine
    jobs: BoardJob[]
    downtimes: BoardDowntime[]
    range: TimeSpan
    dayColumns: BoardDay[]
    labelColumnClassName: string
    timelineWidthPx: number
    now: Date
    nowPercent: number | null
    onSelectJob: (job: BoardJob) => void
    canDrag: boolean
    pendingJobId: string | null
    draggingJobId: string | null
    dragPreview: DragPreview | null
    /** Sürükleme sürerken bu satırın hükmü (`null` = sürükleme yok). */
    dropVerdict: MoveVerdict | null
    isDropTarget: boolean
}

/** Sürüklerken satır zemini: uygun olmayan satırlar hafif kırmızı, üzerindeki satır çerçeveli. */
const DROP_TARGET_CLASSES: Record<MoveVerdict, string> = {
    same: "ring-2 ring-inset ring-sky-500",
    ok: "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10",
    unknown: "ring-2 ring-inset ring-amber-500 bg-amber-500/10",
    warning: "ring-2 ring-inset ring-amber-500 bg-amber-500/10",
    error: "ring-2 ring-inset ring-red-500 bg-red-500/15",
}

/** Bir makine satırı: arka planda vardiya dışı + duruş blokları, önde iş çubukları. */
export function BoardMachineRow({
    machine,
    jobs,
    downtimes,
    range,
    dayColumns,
    labelColumnClassName,
    timelineWidthPx,
    now,
    nowPercent,
    onSelectJob,
    canDrag,
    pendingJobId,
    draggingJobId,
    dragPreview,
    dropVerdict,
    isDropTarget,
}: Props) {
    const { setNodeRef } = useDroppable({ id: machine.id })
    const offShift = useMemo(() => offShiftSpans(range, machine.shifts), [range, machine.shifts])
    const exceptionByDate = useMemo(
        () => new Map(machine.dayExceptions.map((exception) => [exception.date, exception.kind])),
        [machine.dayExceptions],
    )

    return (
        <div className="flex border-b last:border-b-0">
            <div className={cn("sticky start-0 z-10 flex flex-col justify-center gap-0.5 border-e bg-card px-3 py-1.5", labelColumnClassName)}>
                <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="text-sm font-semibold">{machine.code}</span>
                    {machine.status !== "ACTIVE" ? (
                        <Badge variant="outline" className={cn("rounded-full px-1.5 py-0 text-[10px]", MACHINE_STATUS_BADGE_CLASSES[machine.status])}>
                            {MACHINE_STATUS_LABELS[machine.status]}
                        </Badge>
                    ) : null}
                </div>
                <span className="truncate text-xs text-muted-foreground" title={machine.name}>{machine.name}</span>
                {machine.shiftPatternName ? null : (
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Vardiya düzeni yok</span>
                )}
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "relative h-16 transition-colors",
                    dropVerdict === "error" && !isDropTarget && "bg-red-500/5",
                    isDropTarget && dropVerdict ? DROP_TARGET_CLASSES[dropVerdict] : null,
                )}
                style={{ width: timelineWidthPx }}
            >
                {offShift.map((span) => {
                    const position = spanPercent(range, span)
                    return position ? (
                        <div key={span.startMs} className={cn("absolute inset-y-0", OFF_SHIFT_CLASS)} style={{ left: `${position.left}%`, width: `${position.width}%` }} aria-hidden />
                    ) : null
                })}

                {dayColumns.map((day) => {
                    const position = spanPercent(range, day)
                    if (!position) return null
                    const exception = exceptionByDate.get(day.date)
                    return (
                        <div key={day.date} className="pointer-events-none absolute inset-y-0 border-s border-border/70" style={{ left: `${position.left}%`, width: `${position.width}%` }}>
                            {exception ? (
                                <span className="absolute start-1 top-0.5 rounded bg-background/80 px-1 text-[10px] font-medium text-muted-foreground">
                                    {CALENDAR_EXCEPTION_KIND_LABELS[exception]}
                                </span>
                            ) : null}
                        </div>
                    )
                })}

                {downtimes.map((downtime) => {
                    const position = spanPercent(range, toSpan(downtime.startAt, downtime.endAt))
                    if (!position) return null
                    const title = `${DOWNTIME_KIND_LABELS[downtime.kind]} · ${formatProductionTimeRange(downtime.startAt, downtime.endAt)}${downtime.reason ? ` · ${downtime.reason}` : ""}`
                    return (
                        <div
                            key={downtime.id}
                            className={cn("absolute inset-y-1 rounded-md", DOWNTIME_PATTERN_CLASS)}
                            style={{ left: `${position.left}%`, width: `${position.width}%` }}
                            title={title}
                            role="img"
                            aria-label={title}
                        />
                    )
                })}

                {jobs.map((job) => (
                    <BoardJobBar
                        key={job.id}
                        job={job}
                        range={range}
                        now={now}
                        onSelect={onSelectJob}
                        canDrag={canDrag}
                        isPending={pendingJobId === job.id}
                        dragPreview={draggingJobId === job.id ? dragPreview : null}
                    />
                ))}

                {nowPercent !== null ? (
                    <div className="pointer-events-none absolute inset-y-0 z-[5] w-0.5 -translate-x-1/2 bg-red-500/80" style={{ left: `${nowPercent}%` }} aria-hidden />
                ) : null}
            </div>
        </div>
    )
}
