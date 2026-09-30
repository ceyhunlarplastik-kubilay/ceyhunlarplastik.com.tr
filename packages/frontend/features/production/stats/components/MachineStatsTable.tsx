import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MachineStatsRow, MachineStatsTotals } from "@/features/production/stats/api/types"
import { downtimeMinutesTotal, formatHours, sumValues, unplannedStopMinutes } from "@/features/production/stats/lib/machineStatsFormat"
import { formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { OeeBadge } from "./OeeBadge"

/** Satır ve toplam aynı hücreleri kullanır (makine sütunu hariç). */
function MetricCells({ totals }: { totals: MachineStatsTotals }) {
    const downtime = totals.time.downtimeMinutes
    const stops = totals.report.stopMinutes
    return (
        <>
            <TableCell className="text-end tabular-nums">{formatHours(totals.time.capacityMinutes)}</TableCell>
            <TableCell
                className="text-end tabular-nums"
                title={totals.time.overtimeMinutes > 0 ? `Vardiya dışı üretim ${formatHours(totals.time.overtimeMinutes)}` : undefined}
            >
                {formatRate(totals.utilization)}
                {totals.time.overtimeMinutes > 0 ? <span className="ms-1 text-xs text-muted-foreground">+{formatHours(totals.time.overtimeMinutes)}</span> : null}
            </TableCell>
            <TableCell
                className="text-end tabular-nums"
                title={`Planlı bakım ${formatHours(downtime.PLANNED_MAINTENANCE)} · arıza ${formatHours(downtime.BREAKDOWN)} · diğer ${formatHours(downtime.OTHER)}`}
            >
                {formatHours(downtimeMinutesTotal(downtime))}
            </TableCell>
            <TableCell className="text-end tabular-nums">{formatHours(totals.time.idleMinutes)}</TableCell>
            <TableCell className="whitespace-nowrap text-end tabular-nums">
                {formatQuantity(totals.report.reportedLotCount)}
                {totals.report.unreportedLotCount > 0 ? (
                    <Badge
                        variant="outline"
                        className="ms-2 rounded-full border-amber-300 text-[10px] text-amber-800 dark:border-amber-800 dark:text-amber-300"
                        title="İş kapanırken raporu girilmemiş vardiya — süre ve OEE'ye girmedi"
                    >
                        {formatQuantity(totals.report.unreportedLotCount)} raporsuz
                    </Badge>
                ) : null}
            </TableCell>
            <TableCell
                className="text-end tabular-nums"
                title={`Plansız ${formatHours(unplannedStopMinutes(stops))} · planlı ${formatHours(stops.PLANNED)}`}
            >
                {formatHours(sumValues(stops))}
            </TableCell>
            <TableCell className="text-end tabular-nums">{formatRate(totals.availability)}</TableCell>
            <TableCell className="text-end tabular-nums">{formatRate(totals.performance)}</TableCell>
            <TableCell className="text-end tabular-nums">{formatRate(totals.quality)}</TableCell>
            <TableCell className="text-end"><OeeBadge oee={totals.oee} /></TableCell>
        </>
    )
}

/** Makine başına satır + toplam. Zaman sütunları vardiya süresinden, OEE sütunları raporlu vardiyalardan. */
export function MachineStatsTable({ rows, totals }: { rows: MachineStatsRow[]; totals: MachineStatsTotals }) {
    return (
        <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Makine</TableHead>
                        <TableHead className="text-end">Vardiya süresi</TableHead>
                        <TableHead className="text-end">Kullanım</TableHead>
                        <TableHead className="text-end">Makine duruşu</TableHead>
                        <TableHead className="text-end">Boş</TableHead>
                        <TableHead className="text-end">Raporlu vardiya</TableHead>
                        <TableHead className="text-end">Duruş (rapor)</TableHead>
                        <TableHead className="text-end">Kullanılabilirlik</TableHead>
                        <TableHead className="text-end">Performans</TableHead>
                        <TableHead className="text-end">Kalite</TableHead>
                        <TableHead className="text-end">OEE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.machineId}>
                            <TableCell className="whitespace-nowrap">
                                <span className="font-medium">{row.code}</span>
                                <span className="ms-1.5 text-muted-foreground">{row.name}</span>
                                <span className="ms-1.5 text-xs text-muted-foreground">· {row.areaCode}</span>
                            </TableCell>
                            <MetricCells totals={row} />
                        </TableRow>
                    ))}
                </TableBody>
                {rows.length > 1 ? (
                    <TableFooter>
                        <TableRow>
                            <TableCell className="font-medium">Toplam</TableCell>
                            <MetricCells totals={totals} />
                        </TableRow>
                    </TableFooter>
                ) : null}
            </Table>
        </div>
    )
}
