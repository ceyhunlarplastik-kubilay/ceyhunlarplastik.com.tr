"use client"

import Link from "next/link"
import { MessageSquareText } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LotListItem } from "@/features/production/lots/api/types"
import { formatLotShiftDay, formatLotTimeRange, lotDetailPath, lotPlannedQuantity } from "@/features/production/lots/utils/lotFormat"
import { JOB_STATUS_LABELS } from "@/features/production/shared/jobStatus"
import { LotDisplayStatusBadge } from "./LotDisplayStatusBadge"
import { formatOperatorShortName } from "@/features/production/shared/operators"

/** Lot satırları; lot numarası ayrıntıya gider. Ekip vardiya ekibinden türemişse soluk yazılır. */
export function LotsTable({ lots }: { lots: LotListItem[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Vardiya</TableHead>
                    <TableHead>Makine · kalıp</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-end">Planlanan</TableHead>
                    <TableHead>Ekip</TableHead>
                    <TableHead>Durum</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {lots.map((lot) => {
                    const first = lot.outputs[0]
                    return (
                        <TableRow key={lot.id}>
                            <TableCell className="whitespace-nowrap">
                                <Link href={lotDetailPath(lot.lotNumber)} className="inline-flex items-center gap-1.5 font-semibold tabular-nums underline-offset-4 hover:underline">
                                    {lot.colorHex ? (
                                        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: lot.colorHex }} title={lot.colorName ?? undefined} aria-hidden />
                                    ) : null}
                                    {lot.lotNumber}
                                </Link>
                                {lot.noteCount > 0 ? (
                                    <span className="ms-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground" title={`${lot.noteCount} not`}>
                                        <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                                        {lot.noteCount}
                                    </span>
                                ) : null}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <div>{formatLotShiftDay(lot)}</div>
                                <div className="text-xs tabular-nums text-muted-foreground">{formatLotTimeRange(lot)}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <span className="font-medium">{lot.job.machine.code}</span> · {lot.job.mold.code}
                            </TableCell>
                            <TableCell className="min-w-48">
                                {first ? (
                                    <>
                                        <div className="font-mono text-xs">{first.order?.variantCode ?? first.sizeCode}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {first.productName}
                                            {first.order ? ` · ${first.order.orderNumber}` : " · yan ürün"}
                                            {lot.outputs.length > 1 ? ` · +${lot.outputs.length - 1} göz grubu` : ""}
                                        </div>
                                    </>
                                ) : null}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-end tabular-nums">
                                <div>{lotPlannedQuantity(lot.outputs).toLocaleString("tr-TR")} adet</div>
                                <div className="text-xs text-muted-foreground">{lot.plannedShots.toLocaleString("tr-TR")} baskı</div>
                            </TableCell>
                            <TableCell className="min-w-32 text-xs">
                                {lot.operators.list.length === 0 ? (
                                    <span className="text-muted-foreground">Atanmamış</span>
                                ) : (
                                    <span className={lot.operators.source === "roster" ? "text-muted-foreground" : undefined}>
                                        {lot.operators.list.map(formatOperatorShortName).join(", ")}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="space-y-1">
                                <LotDisplayStatusBadge lot={lot} />
                                <div className="text-xs text-muted-foreground">İş: {JOB_STATUS_LABELS[lot.job.status]}</div>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
