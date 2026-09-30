"use client"

import { useState, type ReactNode } from "react"
import {
    DndContext,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
    canTransitionJob,
    JOB_STATUS_LABELS,
    KANBAN_JOB_STATUSES,
    type ProductionJobStatus,
} from "@core/helpers/production/jobStateMachine"
import type { KanbanJob } from "@/features/production/kanban/api/types"
import { KanbanJobCard } from "./KanbanJobCard"

type Props = {
    columns: Record<ProductionJobStatus, KanbanJob[]>
    completedWindowDays: number
    now: Date
    today: string
    pendingJobId: string | null
    onTransition: (job: KanbanJob, status: ProductionJobStatus) => void
}

/**
 * Durum sütunları. Kart başka sütuna sürüklenince geçiş istenir; sürüklerken yalnız durum
 * makinesinin izin verdiği sütunlar vurgulanır, diğerleri soluklaşır (kural core'da, aynısı
 * sunucuda da uygulanır).
 */
export function KanbanBoard({ columns, completedWindowDays, now, today, pendingJobId, onTransition }: Props) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
    const [dragging, setDragging] = useState<KanbanJob | null>(null)

    function findJob(id: string): KanbanJob | null {
        for (const status of KANBAN_JOB_STATUSES) {
            const job = columns[status].find((entry) => entry.id === id)
            if (job) return job
        }
        return null
    }

    function handleDragStart(event: DragStartEvent) {
        setDragging(findJob(String(event.active.id)))
    }

    function handleDragEnd(event: DragEndEvent) {
        const job = dragging
        setDragging(null)
        if (!job || !event.over) return
        const target = event.over.id as ProductionJobStatus
        if (target === job.status) return
        if (!canTransitionJob(job.status, target)) {
            toast.error(`"${JOB_STATUS_LABELS[job.status]}" durumundan "${JOB_STATUS_LABELS[target]}" durumuna geçilemez.`)
            return
        }
        onTransition(job, target)
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDragging(null)}
            accessibility={{
                screenReaderInstructions: { draggable: "Kartı başka bir durum sütununa sürükleyin; klavyeyle karttaki menüden durumu değiştirin." },
                announcements: {
                    onDragStart: () => "Kart sürükleniyor.",
                    onDragOver: ({ over }) => (over ? `${JOB_STATUS_LABELS[over.id as ProductionJobStatus]} sütunu üzerinde.` : "Sütun dışında."),
                    onDragEnd: ({ over }) => (over ? `${JOB_STATUS_LABELS[over.id as ProductionJobStatus]} sütununa bırakıldı.` : "Bırakıldı; değişiklik yok."),
                    onDragCancel: () => "Sürükleme iptal edildi.",
                },
            }}
        >
            <div className="grid auto-cols-[minmax(15rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
                {KANBAN_JOB_STATUSES.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        title={status === "COMPLETED" ? `${JOB_STATUS_LABELS[status]} (son ${completedWindowDays} gün)` : JOB_STATUS_LABELS[status]}
                        jobs={columns[status]}
                        dropState={dragging
                            ? dragging.status === status ? "source" : canTransitionJob(dragging.status, status) ? "allowed" : "blocked"
                            : null}
                    >
                        {columns[status].map((job) => (
                            <KanbanJobCard
                                key={job.id}
                                job={job}
                                now={now}
                                today={today}
                                isPending={pendingJobId === job.id}
                                onTransition={onTransition}
                            />
                        ))}
                    </KanbanColumn>
                ))}
            </div>
        </DndContext>
    )
}

function KanbanColumn({
    status,
    title,
    jobs,
    dropState,
    children,
}: {
    status: ProductionJobStatus
    title: string
    jobs: KanbanJob[]
    dropState: "source" | "allowed" | "blocked" | null
    children: ReactNode
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status })

    return (
        <section
            ref={setNodeRef}
            aria-label={title}
            className={cn(
                "flex min-h-72 flex-col gap-2 rounded-2xl border bg-muted/40 p-2 transition-colors",
                dropState === "allowed" && "border-emerald-400 bg-emerald-500/5",
                dropState === "allowed" && isOver && "ring-2 ring-emerald-500",
                dropState === "blocked" && "opacity-50",
                dropState === "blocked" && isOver && "ring-2 ring-red-500",
            )}
        >
            <header className="flex items-center justify-between px-1 pt-1">
                <h2 className="text-sm font-semibold">{title}</h2>
                <span className="rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">{jobs.length}</span>
            </header>
            {jobs.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">İş yok</p>
            ) : children}
        </section>
    )
}
