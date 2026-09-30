"use client"

import Link from "next/link"
import { useDraggable } from "@dnd-kit/core"
import { GripVertical, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionOrderNumber } from "@core/helpers/production/productionOrders"
import type { BoardPendingOrder } from "@/features/production/board/api/types"
import type { DragPreview } from "@/features/production/board/utils/boardGeometry"
import { PRIORITY_BADGE_CLASSES, PRIORITY_LABELS } from "@/features/production/shared/orderStatus"

const PREVIEW_CLASSES: Record<DragPreview["verdict"], string> = {
    same: "bg-foreground text-background",
    ok: "bg-emerald-600 text-white",
    unknown: "bg-amber-500 text-white",
    warning: "bg-amber-500 text-white",
    error: "bg-red-600 text-white",
}

/** Sürükleme verisi: tahta emir kartını işten bu alanla ayırır. */
export const PENDING_ORDER_DRAG_PREFIX = "order:"

type Props = {
    orders: BoardPendingOrder[]
    total: number
    draggingOrderId: string | null
    canDrag: boolean
    /** Tahtanın çakışma kipinin açıklaması — bırakınca ne olacağı. */
    placementHint: string
    onSuggest: (order: BoardPendingOrder) => void
}

/**
 * Planlanmayı bekleyen (Taslak) emirler — kart tahtada bir makine satırına sürüklenince iş o
 * makinede bırakılan andan planlanır; "Öner" kalıp × makine adaylarını gösterir.
 */
export function PendingOrdersPanel({ orders, total, draggingOrderId, canDrag, placementHint, onSuggest }: Props) {
    return (
        <section className="space-y-2 rounded-2xl border bg-card p-3" aria-label="Bekleyen emirler">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold">
                    Bekleyen emirler <span className="font-normal text-muted-foreground">({total})</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                    Kartı bir makine satırına sürükleyin. {placementHint}
                </p>
            </header>
            {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Planlanacak taslak emir yok. <Link href="/uretim/emirler" className="underline underline-offset-4">Yeni emir aç</Link>
                </p>
            ) : (
                <ul className="flex gap-2 overflow-x-auto pb-1">
                    {orders.map((order) => (
                        <li key={order.id} className="shrink-0">
                            <PendingOrderCard
                                order={order}
                                canDrag={canDrag}
                                isDragging={draggingOrderId === order.id}
                                onSuggest={() => onSuggest(order)}
                            />
                        </li>
                    ))}
                    {total > orders.length ? (
                        <li className="flex shrink-0 items-center px-2 text-xs text-muted-foreground">
                            +{total - orders.length} emir daha (termine göre ilk {orders.length})
                        </li>
                    ) : null}
                </ul>
            )}
        </section>
    )
}

function PendingOrderCard({
    order,
    canDrag,
    isDragging,
    onSuggest,
}: {
    order: BoardPendingOrder
    canDrag: boolean
    isDragging: boolean
    onSuggest: () => void
}) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `${PENDING_ORDER_DRAG_PREFIX}${order.id}`,
        data: { kind: "order", orderId: order.id },
        disabled: !canDrag,
    })

    return (
        <div className={cn("flex w-60 items-stretch gap-1 rounded-xl border bg-background", isDragging && "opacity-40")}>
            <button
                ref={setNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                className={cn(
                    "flex min-w-0 flex-1 items-start gap-1.5 rounded-s-xl p-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    canDrag && "cursor-grab touch-none",
                )}
                aria-label={`${formatProductionOrderNumber(order.orderNumber)} · ${order.variantCode} — tahtaya sürükleyerek planlayın`}
            >
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <PendingOrderSummary order={order} />
            </button>
            <Button type="button" variant="ghost" size="icon" className="h-auto rounded-s-none rounded-e-xl" onClick={onSuggest} aria-label={`${formatProductionOrderNumber(order.orderNumber)} için öneri`} title="Öner">
                <Sparkles className="h-4 w-4" />
            </Button>
        </div>
    )
}

function PendingOrderSummary({ order }: { order: BoardPendingOrder }) {
    return (
        <span className="min-w-0 flex-1 space-y-0.5">
            <span className="flex items-center gap-1.5">
                {order.colorHex ? (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: order.colorHex }} aria-hidden />
                ) : null}
                <span className="text-sm font-semibold tabular-nums">{formatProductionOrderNumber(order.orderNumber)}</span>
                {order.priority === "HIGH" || order.priority === "URGENT" ? (
                    <Badge variant="outline" className={cn("rounded-full px-1.5 py-0 text-[10px]", PRIORITY_BADGE_CLASSES[order.priority])}>
                        {PRIORITY_LABELS[order.priority]}
                    </Badge>
                ) : null}
            </span>
            <span className="block truncate font-mono text-xs">{order.variantCode}</span>
            <span className="block truncate text-xs text-muted-foreground" title={`${order.productName} · ${order.sizeLabel}`}>{order.productName}</span>
            <span className="block text-xs tabular-nums">
                {order.quantity.toLocaleString("tr-TR")} adet{order.dueDate ? ` · termin ${formatDateKey(order.dueDate).slice(0, 5)}` : ""}
            </span>
        </span>
    )
}

/** Sürüklenirken imlecin altında görünen kart (DragOverlay). */
export function PendingOrderDragCard({ order, preview }: { order: BoardPendingOrder; preview: DragPreview | null }) {
    return (
        <div className="relative w-56 cursor-grabbing rounded-xl border bg-background p-2 shadow-lg">
            {preview ? (
                <span className={cn("absolute -top-6 start-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium shadow", PREVIEW_CLASSES[preview.verdict])}>
                    {preview.label}
                </span>
            ) : null}
            <PendingOrderSummary order={order} />
        </div>
    )
}
