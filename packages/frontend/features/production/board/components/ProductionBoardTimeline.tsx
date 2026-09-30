"use client"

import { useMemo, useRef, useState } from "react"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragMoveEvent,
    type DragStartEvent,
} from "@dnd-kit/core"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import type { BoardJob, BoardPendingOrder, ProductionBoard } from "@/features/production/board/api/types"
import {
    boardDays,
    boardPixelsPerDay,
    draggedStartAt,
    instantPercent,
    moveVerdict,
    orderDropVerdict,
    pointerStartAt,
    spanPercent,
    toSpan,
    type BoardAreaGroup,
    type DragPreview,
} from "@/features/production/board/utils/boardGeometry"
import { BoardMachineRow } from "./BoardMachineRow"
import { PendingOrderDragCard, PendingOrdersPanel } from "./PendingOrdersPanel"

/** Sol sütun (makine adı) genişliği — telefonda dar; satır ve başlık aynı CSS değişkenini okur. */
const LABEL_COLUMN_CLASS = "w-[var(--board-label)] shrink-0"

type Props = {
    board: ProductionBoard
    groups: BoardAreaGroup[]
    days: number
    now: Date
    onSelectJob: (job: BoardJob) => void
    /** Bırakılınca: hedef makine + istenen bağlama başı. Verilmezse tahta sürüklenmez. */
    onMoveJob?: (job: BoardJob, machineId: string, startAt: Date) => void
    /** Sunucuya giden taşıma — çubuk bekleme görünümünde. */
    pendingJobId?: string | null
    /** Bekleyen emir kartı bir satıra bırakılınca: hedef makine + istenen başlangıç. */
    onPlanOrder?: (order: BoardPendingOrder, machineId: string, startAt: Date) => void
    onSuggestOrder?: (order: BoardPendingOrder) => void
    placementHint?: string
}

type DragState =
    | { kind: "job"; job: BoardJob; overMachineId: string | null; deltaX: number }
    | { kind: "order"; order: BoardPendingOrder; overMachineId: string | null; startAt: Date | null }

type DragPointer = { over: { id: string | number; rect: { left: number; width: number } } | null; activatorEvent: Event; delta: { x: number } }

/**
 * Gantt ızgarası: yatay kayan kap içinde yapışkan makine sütunu + gün başlıkları + alan
 * grupları. Konumlar pencereye göre YÜZDE; kap genişliği gün başına pikselden gelir.
 *
 * Sürükle-bırak: planlı iş yatayda zamanı (15 dk adım), dikeyde makineyi değiştirir. Hedef satır
 * işin `machineFit`'ine göre boyanır; asıl karar taşıma ucunda motorla yeniden verilir.
 */
export function ProductionBoardTimeline({
    board,
    groups,
    days,
    now,
    onSelectJob,
    onMoveJob,
    pendingJobId,
    onPlanOrder,
    onSuggestOrder,
    placementHint = "",
}: Props) {
    const range = useMemo(() => toSpan(board.range.startAt, board.range.endAt), [board.range.startAt, board.range.endAt])
    const dayColumns = useMemo(() => boardDays(board.range.from, board.range.to), [board.range.from, board.range.to])
    const timelineWidth = dayColumns.length * boardPixelsPerDay(days)
    const nowPercent = instantPercent(range, now)

    const jobsByMachine = useMemo(() => groupBy(board.jobs, (job) => job.machineId), [board.jobs])
    const downtimesByMachine = useMemo(() => groupBy(board.downtimes, (downtime) => downtime.machineId), [board.downtimes])
    const jobById = useMemo(() => new Map(board.jobs.map((job) => [job.id, job])), [board.jobs])
    const machineCodeById = useMemo(() => new Map(board.machines.map((machine) => [machine.id, machine.code])), [board.machines])

    // Mesafe eşiği: 6 px'ten kısa hareket tıklamadır (ayrıntı açılır).
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
    const [drag, setDrag] = useState<DragState | null>(null)
    // Bırakmanın ardından gelen tıklama ayrıntıyı açmasın.
    const suppressClickRef = useRef(false)

    const orderById = useMemo(() => new Map(board.pendingOrders.map((order) => [order.id, order])), [board.pendingOrders])

    function targetVerdict(state: DragState, machineId: string) {
        return state.kind === "job" ? moveVerdict(state.job, machineId) : orderDropVerdict(state.order, machineId)
    }

    /** İş: yatay MESAFE; emir kartı: imlecin satırdaki KONUMU. */
    function dropStartAt(state: DragState, event: DragPointer): Date | null {
        if (state.kind === "job") {
            return draggedStartAt({ setupStartAt: state.job.setupStartAt, deltaXPx: event.delta.x, timelineWidthPx: timelineWidth, range })
        }
        const pointer = event.activatorEvent as PointerEvent
        if (!event.over || typeof pointer.clientX !== "number") return null
        return pointerStartAt({ clientX: pointer.clientX + event.delta.x, rectLeft: event.over.rect.left, rectWidth: event.over.rect.width, range })
    }

    function preview(state: DragState): DragPreview | null {
        const machineId = state.overMachineId ?? (state.kind === "job" ? state.job.machineId : null)
        if (!machineId) return null
        const startAt = state.kind === "job"
            ? draggedStartAt({ setupStartAt: state.job.setupStartAt, deltaXPx: state.deltaX, timelineWidthPx: timelineWidth, range })
            : state.startAt
        if (!startAt) return null
        const { verdict, reason } = targetVerdict(state, machineId)
        const target = `${machineCodeById.get(machineId) ?? "?"} · ${formatProductionShortDateTime(startAt)}`
        return { label: verdict === "error" ? `${target} — ${reason ?? "uygun değil"}` : target, verdict }
    }

    function handleDragStart(event: DragStartEvent) {
        const data = event.active.data.current as { kind?: string; orderId?: string } | undefined
        if (data?.kind === "order" && data.orderId) {
            const order = orderById.get(data.orderId)
            if (order) setDrag({ kind: "order", order, overMachineId: null, startAt: null })
            return
        }
        const job = jobById.get(String(event.active.id))
        if (job) setDrag({ kind: "job", job, overMachineId: job.machineId, deltaX: 0 })
    }

    function handleDragMove(event: DragMoveEvent) {
        setDrag((previous) => {
            if (!previous) return previous
            const overMachineId = event.over ? String(event.over.id) : null
            return previous.kind === "job"
                ? { ...previous, deltaX: event.delta.x, overMachineId }
                : { ...previous, overMachineId, startAt: dropStartAt(previous, event as unknown as DragPointer) }
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        const state = drag
        setDrag(null)
        suppressClickRef.current = true
        window.setTimeout(() => { suppressClickRef.current = false }, 0)
        if (!state || !event.over) return

        const machineId = String(event.over.id)
        const { verdict, reason } = targetVerdict(state, machineId)
        const machineCode = machineCodeById.get(machineId) ?? ""
        if (verdict === "error") {
            toast.error(state.kind === "job"
                ? `Kalıp ${machineCode} makinesinde çalışamaz${reason ? `: ${reason}` : "."}`
                : `Emir ${machineCode} makinesinde üretilemez: ${reason ?? "uygun kalıp yok"}.`)
            return
        }
        const startAt = dropStartAt(state, event as unknown as DragPointer)
        if (!startAt) return
        if (state.kind === "order") {
            onPlanOrder?.(state.order, machineId, startAt)
            return
        }
        if (verdict === "same" && startAt.getTime() === new Date(state.job.setupStartAt).getTime()) return
        onMoveJob?.(state.job, machineId, startAt)
    }

    function selectJob(job: BoardJob) {
        if (!suppressClickRef.current) onSelectJob(job)
    }

    const activePreview = drag ? preview(drag) : null
    const canPlanOrders = Boolean(onPlanOrder)

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDrag(null)}
            accessibility={{
                screenReaderInstructions: { draggable: "Planlı işi ya da bekleyen emri bir makine satırına sürükleyin; klavyeyle işi açıp Taşı formunu, emirde Öner düğmesini kullanın." },
                announcements: {
                    onDragStart: () => "Sürükleniyor.",
                    onDragOver: ({ over }) => (over ? `${machineCodeById.get(String(over.id)) ?? ""} makinesinin üzerinde.` : "Satır dışında."),
                    onDragEnd: ({ over }) => (over ? `${machineCodeById.get(String(over.id)) ?? ""} makinesine bırakıldı.` : "Bırakıldı; taşıma yok."),
                    onDragCancel: () => "Taşıma iptal edildi.",
                },
            }}
        >
            {canPlanOrders ? (
                <PendingOrdersPanel
                    orders={board.pendingOrders}
                    total={board.pendingOrderTotal}
                    draggingOrderId={drag?.kind === "order" ? drag.order.id : null}
                    canDrag={canPlanOrders}
                    placementHint={placementHint}
                    onSuggest={(order) => onSuggestOrder?.(order)}
                />
            ) : null}
            <div className={cn("overflow-x-auto rounded-2xl border bg-card [--board-label:7.5rem] sm:[--board-label:11rem]", canPlanOrders && "mt-3")}>
                <div className="relative" style={{ width: `calc(var(--board-label) + ${timelineWidth}px)` }}>
                    <div className="sticky top-0 z-20 flex border-b bg-card">
                        <div className={`sticky start-0 z-30 flex items-end border-e bg-card px-3 py-2 text-xs font-medium text-muted-foreground ${LABEL_COLUMN_CLASS}`}>
                            Makine
                        </div>
                        <div className="relative h-10" style={{ width: timelineWidth }}>
                            {dayColumns.map((day) => {
                                const position = spanPercent(range, day)
                                if (!position) return null
                                return (
                                    <div
                                        key={day.date}
                                        className={cn("absolute inset-y-0 border-s px-2 py-1 text-xs", day.isSunday && "bg-muted/60")}
                                        style={{ left: `${position.left}%`, width: `${position.width}%` }}
                                    >
                                        <span className="font-medium tabular-nums">{day.label}</span>{" "}
                                        <span className="text-muted-foreground">{day.weekday}</span>
                                    </div>
                                )
                            })}
                            {nowPercent !== null ? (
                                <div className="absolute bottom-0 h-2 w-0.5 -translate-x-1/2 bg-red-500" style={{ left: `${nowPercent}%` }} aria-hidden />
                            ) : null}
                        </div>
                    </div>

                    {groups.map((group) => (
                        <section key={group.area.id} aria-label={`${group.area.code} · ${group.area.name}`}>
                            <div className="flex border-b bg-muted/40">
                                <div className={`sticky start-0 z-10 truncate bg-muted/40 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm ${LABEL_COLUMN_CLASS}`}>
                                    {group.area.code} · {group.area.name}
                                </div>
                            </div>
                            {group.machines.map((machine) => (
                                <BoardMachineRow
                                    key={machine.id}
                                    machine={machine}
                                    jobs={jobsByMachine.get(machine.id) ?? []}
                                    downtimes={downtimesByMachine.get(machine.id) ?? []}
                                    range={range}
                                    dayColumns={dayColumns}
                                    labelColumnClassName={LABEL_COLUMN_CLASS}
                                    timelineWidthPx={timelineWidth}
                                    now={now}
                                    nowPercent={nowPercent}
                                    onSelectJob={selectJob}
                                    canDrag={Boolean(onMoveJob)}
                                    pendingJobId={pendingJobId ?? null}
                                    draggingJobId={drag?.kind === "job" ? drag.job.id : null}
                                    dragPreview={drag?.kind === "job" ? activePreview : null}
                                    dropVerdict={drag ? targetVerdict(drag, machine.id).verdict : null}
                                    isDropTarget={drag?.overMachineId === machine.id}
                                />
                            ))}
                        </section>
                    ))}
                </div>
            </div>
            <DragOverlay dropAnimation={null}>
                {drag?.kind === "order" ? <PendingOrderDragCard order={drag.order} preview={activePreview} /> : null}
            </DragOverlay>
        </DndContext>
    )
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const item of items) {
        const bucket = map.get(key(item))
        if (bucket) bucket.push(item)
        else map.set(key(item), [item])
    }
    return map
}
