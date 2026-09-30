import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { productionDateKey } from "@core/helpers/production/productionTime"
import type { ProductHistoryRow } from "@/features/production/stats/api/types"
import {
    cycleDeviation,
    formatCycle,
    formatMinutes,
    formatQuantity,
    formatRate,
    productionPeriodText,
    versionText,
} from "@/features/production/stats/lib/productHistoryFormat"
import { JOB_STATUS_LABELS } from "@/features/production/shared/jobStatus"

/** Üretim başına satır (aile kalıbında ölçü başına). İş no tahtada iş ayrıntısını açar. */
export function ProductHistoryTable({ rows }: { rows: ProductHistoryRow[] }) {
    return (
        <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>İş</TableHead>
                        <TableHead>Emir · varyant</TableHead>
                        <TableHead>Ölçü</TableHead>
                        <TableHead>Versiyon</TableHead>
                        <TableHead>Makine · kalıp</TableHead>
                        <TableHead>Dönem</TableHead>
                        <TableHead className="text-end">Vardiya</TableHead>
                        <TableHead className="text-end">Planlanan</TableHead>
                        <TableHead className="text-end">Sağlam</TableHead>
                        <TableHead className="text-end">Fire</TableHead>
                        <TableHead className="text-end">Çevrim (gerçek / plan)</TableHead>
                        <TableHead className="text-end">Süre (net / plan)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const deviation = cycleDeviation(row.actualCycleSec, row.plannedCycleSec)
                        return (
                            <TableRow key={row.jobOutputId}>
                                <TableCell className="whitespace-nowrap">
                                    <Link
                                        href={`/uretim/tahta?bas=${productionDateKey(new Date(row.startedAt ?? row.plannedStartAt))}&is=${row.lotBaseNumber}`}
                                        className="font-medium tabular-nums underline-offset-4 hover:underline"
                                    >
                                        {row.lotBaseNumber}
                                    </Link>
                                    {row.finalCount ? null : (
                                        <Badge variant="outline" className="ms-2 rounded-full text-[10px]" title="Adet raporlu vardiyaların toplamı; iş kapanınca kesin sayım gelir">
                                            {JOB_STATUS_LABELS[row.jobStatus]}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {row.order ? (
                                        <>
                                            <span className="font-medium">{row.order.orderNumber}</span>
                                            <span className="ms-1.5 font-mono text-xs text-muted-foreground">{row.order.variantCode}</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">yan ürün</span>
                                    )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap" title={row.size.label}>{row.size.sizeCode}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5">
                                        {row.version?.colorHex ? <span className="h-2.5 w-2.5 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: row.version.colorHex }} aria-hidden /> : null}
                                        {versionText(row.version)}
                                    </span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{row.machineCode} · {row.moldCode} <span className="text-xs text-muted-foreground">({row.cavities} göz)</span></TableCell>
                                <TableCell className="whitespace-nowrap tabular-nums text-xs">{productionPeriodText(row)}</TableCell>
                                <TableCell className="text-end tabular-nums">{row.reportedLotCount}/{row.lotCount}</TableCell>
                                <TableCell className="text-end tabular-nums">{formatQuantity(row.plannedQuantity)}</TableCell>
                                <TableCell className="text-end tabular-nums">{formatQuantity(row.goodQuantity)}</TableCell>
                                <TableCell className="text-end tabular-nums">
                                    {formatQuantity(row.scrapQuantity)}
                                    <span className={cn("ms-1 text-xs", row.scrapRate !== null && row.scrapRate > 0.05 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                                        {formatRate(row.scrapRate)}
                                    </span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-end tabular-nums">
                                    {formatCycle(row.actualCycleSec)} <span className="text-muted-foreground">/ {formatCycle(row.plannedCycleSec)}</span>
                                    {deviation ? (
                                        <span className={cn("ms-1 text-xs", deviation.ratio > 0.1 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>{deviation.text}</span>
                                    ) : null}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-end tabular-nums text-xs">
                                    {formatMinutes(row.runMinutes)} <span className="text-muted-foreground">/ {formatMinutes(row.plannedMinutes)}</span>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
