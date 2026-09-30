"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { describeMaintenance } from "@core/helpers/production/moldMaintenance"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { cn } from "@/lib/utils"
import type { MoldStatsRow } from "@/features/production/stats/api/types"
import { cycleDeviation, formatCycle, formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { MOLD_STATUS_BADGE_CLASSES, MOLD_STATUS_LABELS } from "@/features/production/shared/moldStatus"

/** Bakım seviyesi: renk + metin (renk tek başına bilgi taşımaz); ayrıntı ipucunda. */
export function MoldMaintenanceText({ row }: { row: Pick<MoldStatsRow, "maintenance" | "lastMaintenanceAt" | "status"> }) {
    const { maintenance } = row
    const lastMaintenance = row.lastMaintenanceAt ? `son bakım ${formatDateKey(row.lastMaintenanceAt.slice(0, 10))}` : "bakım kaydı yok"
    if (maintenance.level === "NONE" || maintenance.intervalShots === null) {
        return <span className="text-muted-foreground" title={lastMaintenance}>Aralık yok</span>
    }
    const projectedDue = maintenance.projectedLevel === "DUE" && maintenance.level !== "DUE"
    const label = maintenance.level === "DUE"
        ? "Zamanı geldi"
        : maintenance.level === "SOON"
            ? "Yaklaşıyor"
            : `%${Math.round((maintenance.ratio ?? 0) * 100)}`
    const active = row.status === "ACTIVE"
    return (
        <span className="inline-flex flex-col leading-tight" title={`${describeMaintenance(maintenance)} · ${lastMaintenance}`}>
            <span
                className={cn(
                    "tabular-nums",
                    active && maintenance.level === "DUE" && "font-medium text-destructive",
                    active && maintenance.level === "SOON" && "font-medium text-amber-700 dark:text-amber-400",
                    (!active || maintenance.level === "OK") && "text-muted-foreground",
                )}
            >
                {label}
            </span>
            {projectedDue ? <span className="text-xs text-amber-700 dark:text-amber-400">planlı işlerle aşılacak</span> : null}
        </span>
    )
}

/** Kalıp başına satır. Kalıp kodu ayrıntıyı (makine kartları, renk / hammadde) açar. */
export function MoldStatsTable({ rows, onOpen }: { rows: MoldStatsRow[]; onOpen: (moldId: string) => void }) {
    return (
        <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kalıp</TableHead>
                        <TableHead className="text-end">Toplam baskı</TableHead>
                        <TableHead>Bakım</TableHead>
                        <TableHead className="text-end">Baskı (aralık)</TableHead>
                        <TableHead className="text-end">Raporlu vardiya</TableHead>
                        <TableHead className="text-end">Fire</TableHead>
                        <TableHead className="text-end">Çevrim (gerçek / plan)</TableHead>
                        <TableHead className="text-end">Öneri</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const deviation = cycleDeviation(row.actualCycleSec, row.plannedCycleSec)
                        return (
                            <TableRow key={row.moldId}>
                                <TableCell className="whitespace-nowrap">
                                    <Button type="button" variant="link" className="h-auto p-0 font-medium" onClick={() => onOpen(row.moldId)}>
                                        {row.code}
                                    </Button>
                                    <span className="ms-1.5 text-muted-foreground">{row.name}</span>
                                    {row.status === "ACTIVE" ? null : (
                                        <Badge variant="outline" className={cn("ms-2 rounded-full text-[10px]", MOLD_STATUS_BADGE_CLASSES[row.status])}>
                                            {MOLD_STATUS_LABELS[row.status]}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-end tabular-nums">{formatQuantity(row.totalShots)}</TableCell>
                                <TableCell className="whitespace-nowrap"><MoldMaintenanceText row={row} /></TableCell>
                                <TableCell className="text-end tabular-nums">{row.shots > 0 ? formatQuantity(row.shots) : "—"}</TableCell>
                                <TableCell className="text-end tabular-nums">{row.reportedLotCount > 0 ? row.reportedLotCount : "—"}</TableCell>
                                <TableCell className={cn("text-end tabular-nums", row.scrapRate !== null && row.scrapRate > 0.05 && "text-amber-700 dark:text-amber-400")}>
                                    {formatRate(row.scrapRate)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-end tabular-nums">
                                    {formatCycle(row.actualCycleSec)} <span className="text-muted-foreground">/ {formatCycle(row.plannedCycleSec)}</span>
                                    {deviation ? (
                                        <span className={cn("ms-1 text-xs", Math.abs(deviation.ratio) >= 0.05 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                                            {deviation.text}
                                        </span>
                                    ) : null}
                                </TableCell>
                                <TableCell className="text-end">
                                    {row.suggestionCount > 0 ? (
                                        <Button type="button" size="sm" variant="outline" className="h-7 rounded-full border-amber-300 px-2.5 text-xs text-amber-800 dark:border-amber-800 dark:text-amber-300" onClick={() => onOpen(row.moldId)}>
                                            {row.suggestionCount} öneri
                                        </Button>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
