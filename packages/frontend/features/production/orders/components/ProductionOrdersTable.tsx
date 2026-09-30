"use client"

import { Fragment, useState } from "react"
import { CalendarRange, ChevronDown, CircleDot, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    canSetProductionOrderStatusManually,
    describeProductionOrderDueDate,
    formatProductionOrderNumber,
    isProductionOrderContentEditable,
    isProductionOrderDeletable,
    MANUAL_PRODUCTION_ORDER_STATUSES,
    OPEN_PRODUCTION_ORDER_STATUSES,
} from "@core/helpers/production/productionOrders"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { ProductionOrder, ProductionOrderStatus } from "@/features/production/orders/api/types"
import {
    ORDER_STATUS_BADGE_CLASSES,
    ORDER_STATUS_LABELS,
    PRIORITY_BADGE_CLASSES,
    PRIORITY_LABELS,
    SOURCE_LABELS,
} from "@/features/production/shared/orderStatus"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import { cn } from "@/lib/utils"
import { OrderJobsPanel } from "./OrderJobsPanel"
import { VersionLabel } from "./OrderVariantField"

const DUE_TONE_CLASSES = {
    overdue: "font-medium text-red-600 dark:text-red-400",
    soon: "font-medium text-amber-700 dark:text-amber-400",
    ok: "text-muted-foreground",
} as const

type Props = {
    orders: ProductionOrder[]
    /** Fabrika takviminde bugün ("YYYY-MM-DD"). */
    today: string
    onEdit: (order: ProductionOrder) => void
    /** "Öner": plan önizlemesi (yalnız açık ve varyantı olan emirde). */
    onPlan: (order: ProductionOrder) => void
    onStatusChange: (order: ProductionOrder, status: ProductionOrderStatus) => void
    onDelete: (order: ProductionOrder) => void
}

export function ProductionOrdersTable({ orders, today, onEdit, onPlan, onStatusChange, onDelete }: Props) {
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Emir</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kalıp</TableHead>
                    <TableHead className="text-end">Adet</TableHead>
                    <TableHead>Termin</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Müşteri / kaynak</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-44 text-end">
                        <span className="sr-only">İşlemler</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => {
                    const number = formatProductionOrderNumber(order.orderNumber)
                    const variant = order.productVariant
                    const isOpen = OPEN_PRODUCTION_ORDER_STATUSES.includes(order.status)
                    const due = isOpen ? describeProductionOrderDueDate(order.dueDate, today) : null
                    const statusTargets = MANUAL_PRODUCTION_ORDER_STATUSES.filter((target) => (
                        canSetProductionOrderStatusManually(order.status, target)
                    ))

                    const lastJob = order.jobs[order.jobs.length - 1]
                    const isExpanded = expanded === order.id

                    return (
                        <Fragment key={order.id}>
                        <TableRow className={cn(!isOpen && "text-muted-foreground")}>
                            <TableCell className="font-medium tabular-nums">{number}</TableCell>
                            <TableCell className="max-w-72">
                                <div className="font-medium tabular-nums">{order.variantCode}</div>
                                {variant ? (
                                    <>
                                        <div className="truncate text-xs text-muted-foreground" title={`${variant.product.name} · ${variant.size.label}`}>
                                            {variant.product.name} · {variant.size.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <VersionLabel version={variant.version} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        Varyant katalogdan silinmiş
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                {variant && variant.molds.length > 0 ? (
                                    <div className="flex max-w-48 flex-wrap gap-1">
                                        {variant.molds.map((mold) => (
                                            <Badge key={mold.id} variant="outline" className="rounded-full font-normal" title={mold.name}>
                                                {mold.code} × {mold.cavities}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-red-600 dark:text-red-400">Kalıp yok</span>
                                )}
                            </TableCell>
                            <TableCell className="text-end tabular-nums">{order.quantity.toLocaleString("tr-TR")}</TableCell>
                            <TableCell>
                                {order.dueDate ? (
                                    <div>
                                        <div className="tabular-nums">{order.dueDate.split("-").reverse().join(".")}</div>
                                        {due ? <div className={cn("text-xs", DUE_TONE_CLASSES[due.tone])}>{due.label}</div> : null}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("rounded-full", PRIORITY_BADGE_CLASSES[order.priority])}>
                                    {PRIORITY_LABELS[order.priority]}
                                </Badge>
                            </TableCell>
                            <TableCell className="max-w-48">
                                {order.customer ? <div className="truncate" title={order.customer.name}>{order.customer.name}</div> : null}
                                <div className="text-xs text-muted-foreground">{SOURCE_LABELS[order.source]}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("rounded-full", ORDER_STATUS_BADGE_CLASSES[order.status])}>
                                    {ORDER_STATUS_LABELS[order.status]}
                                </Badge>
                                {lastJob ? (
                                    <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                                        {lastJob.machine.code} · bitiş {formatProductionShortDateTime(lastJob.plannedEndAt)}
                                    </div>
                                ) : null}
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-1">
                                    {order.jobs.length > 0 ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-expanded={isExpanded}
                                            aria-label={`${number} işlerini ve lotlarını ${isExpanded ? "gizle" : "göster"}`}
                                            onClick={() => setExpanded(isExpanded ? null : order.id)}
                                        >
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`${number} için plan önizlemesi`}
                                        title="Öner: hangi makinede ne zaman biter"
                                        onClick={() => onPlan(order)}
                                        disabled={!isOpen || !variant}
                                    >
                                        <CalendarRange className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`${number} düzenle`}
                                        onClick={() => onEdit(order)}
                                        disabled={!isProductionOrderContentEditable(order.status)}
                                        title={isProductionOrderContentEditable(order.status) ? undefined : "Yalnız taslak ya da beklemedeki emir düzenlenir"}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`${number} durumunu değiştir`}
                                                disabled={statusTargets.length === 0}
                                            >
                                                <CircleDot className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel className="text-xs">Durumu değiştir</DropdownMenuLabel>
                                            {statusTargets.map((target) => (
                                                <DropdownMenuItem key={target} onSelect={() => onStatusChange(order, target)}>
                                                    {ORDER_STATUS_LABELS[target]}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {isProductionOrderDeletable(order.status) ? (
                                        <ConfirmDeleteDialog
                                            trigger={(
                                                <Button type="button" variant="ghost" size="icon" aria-label={`${number} sil`}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            title="Taslak emir silinsin mi?"
                                            description="Yalnız taslak emir silinir. Planlanmış ya da yanlış açılmış ama izi kalsın istenen emir için İptal kullanın."
                                            itemNames={[`${number} · ${order.variantCode} · ${order.quantity.toLocaleString("tr-TR")} adet`]}
                                            onConfirm={() => onDelete(order)}
                                        />
                                    ) : null}
                                </div>
                            </TableCell>
                        </TableRow>
                        {isExpanded ? (
                            <TableRow>
                                <TableCell colSpan={9} className="bg-muted/20">
                                    <OrderJobsPanel order={order} />
                                </TableCell>
                            </TableRow>
                        ) : null}
                        </Fragment>
                    )
                })}
            </TableBody>
        </Table>
    )
}
