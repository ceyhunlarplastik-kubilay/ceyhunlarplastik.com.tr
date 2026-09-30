"use client"

import { useDraggable } from "@dnd-kit/core"
import { AlertTriangle, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { allowedJobTransitions, JOB_TRANSITION_LABELS, type ProductionJobStatus } from "@core/helpers/production/jobStateMachine"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { formatDurationMinutes, formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import type { KanbanJob } from "@/features/production/kanban/api/types"
import { earliestDueDate, jobDelayMinutes, primaryOrder } from "@/features/production/kanban/utils/kanbanColumns"
import { JOB_STATUS_BORDER_CLASSES } from "@/features/production/shared/jobStatus"

type Props = {
    job: KanbanJob
    now: Date
    today: string
    isPending: boolean
    /** Sürüklemeyle aynı kural; klavye / dokunmatik alternatifi. */
    onTransition: (job: KanbanJob, status: ProductionJobStatus) => void
}

/**
 * Pano kartı: iş no, emir + varyant, ürün / ölçü, makine · kalıp, planlı pencere, adet (tamamlandıysa
 * sağlam / fire), gecikme ve termin uyarısı. Sürüklenebilir; "…" menüsü izinli geçişleri listeler.
 */
export function KanbanJobCard({ job, now, today, isPending, onTransition }: Props) {
    const transitions = allowedJobTransitions(job.status)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: job.id,
        data: { status: job.status },
        disabled: transitions.length === 0 || isPending,
    })

    const order = primaryOrder(job)
    const delay = jobDelayMinutes(job, now)
    const dueDate = earliestDueDate(job)
    const dueMissed = Boolean(dueDate && dueDate < today && job.status !== "COMPLETED")
    const good = job.outputs.reduce((sum, output) => sum + output.goodQuantity, 0)
    const scrap = job.outputs.reduce((sum, output) => sum + output.scrapQuantity, 0)
    const planned = job.outputs.reduce((sum, output) => sum + output.plannedQuantity, 0)
    const firstOutput = job.outputs[0]

    return (
        <article
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "relative space-y-1.5 rounded-xl border border-s-4 bg-background p-2.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                JOB_STATUS_BORDER_CLASSES[job.status],
                transitions.length > 0 && !isPending && "cursor-grab touch-none",
                isDragging && "z-50 cursor-grabbing opacity-90 shadow-lg",
                isPending && "animate-pulse opacity-60",
            )}
            style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
            aria-label={`İş ${job.lotBaseNumber}${order ? ` · ${order.orderNumber}` : ""} · ${job.machine.code}`}
        >
            <header className="flex items-start gap-2">
                {job.colorHex ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: job.colorHex }} title={job.colorName ?? undefined} aria-hidden />
                ) : null}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold tabular-nums">
                        İş {job.lotBaseNumber}
                        {order ? <span className="font-normal text-muted-foreground"> · {order.orderNumber}</span> : null}
                    </p>
                    <p className="truncate font-mono text-xs">{order?.variantCode ?? firstOutput?.sizeCode}</p>
                </div>
                {transitions.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="-me-1 -mt-1 h-7 w-7"
                                aria-label={`İş ${job.lotBaseNumber} durumunu değiştir`}
                                // Menü tıklaması sürüklemeyi başlatmasın.
                                onPointerDown={(event) => event.stopPropagation()}
                                disabled={isPending}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Durumu değiştir</DropdownMenuLabel>
                            {transitions.map((status) => (
                                <DropdownMenuItem key={status} onSelect={() => onTransition(job, status)}>
                                    {JOB_TRANSITION_LABELS[status]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </header>

            {firstOutput ? (
                <p className="truncate text-xs text-muted-foreground" title={job.outputs.map((output) => `${output.sizeCode} ${output.productName}`).join(" · ")}>
                    {firstOutput.productName} · {firstOutput.sizeCode}
                    {job.outputs.length > 1 ? ` +${job.outputs.length - 1} göz grubu` : ""}
                </p>
            ) : null}
            <p className="text-xs">
                <span className="font-medium">{job.machine.code}</span> · {job.mold.code}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
                {formatProductionShortDateTime(job.setupStartAt)} → {formatProductionShortDateTime(job.plannedEndAt)} · {job.lotCount} lot
            </p>
            <p className="text-xs tabular-nums">
                {job.status === "COMPLETED"
                    ? <>Sağlam {good.toLocaleString("tr-TR")} · fire {scrap.toLocaleString("tr-TR")}</>
                    : <>{planned.toLocaleString("tr-TR")} adet planlı</>}
            </p>

            {delay !== null || dueMissed || dueDate ? (
                <div className="flex flex-wrap gap-1">
                    {delay !== null ? (
                        <Badge variant="outline" className="gap-1 rounded-full border-red-200 bg-red-50 px-1.5 py-0 text-[10px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            <AlertTriangle className="h-3 w-3" aria-hidden />
                            Plandan {formatDurationMinutes(delay)} geç
                        </Badge>
                    ) : null}
                    {dueDate ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full px-1.5 py-0 text-[10px]",
                                dueMissed && "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
                            )}
                        >
                            {dueMissed ? "Termin geçti · " : "Termin "}{formatDateKey(dueDate).slice(0, 5)}
                        </Badge>
                    ) : null}
                </div>
            ) : null}
        </article>
    )
}
