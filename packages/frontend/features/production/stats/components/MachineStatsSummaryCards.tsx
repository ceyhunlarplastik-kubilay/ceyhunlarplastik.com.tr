import type { MachineStatsTotals } from "@/features/production/stats/api/types"
import {
    downtimeMinutesTotal,
    formatHours,
    OEE_LEVEL_LABELS,
    oeeComponentsText,
    oeeLevel,
    sumValues,
    unplannedStopMinutes,
} from "@/features/production/stats/lib/machineStatsFormat"
import { formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { OeeBadge } from "./OeeBadge"
import { StatsSummaryCard } from "./StatsSummaryCard"

/** Pencerenin özeti: OEE (bileşenleriyle), kullanım, rapor duruşları, makine duruşu, raporlu vardiya. */
export function MachineStatsSummaryCards({ totals }: { totals: MachineStatsTotals }) {
    const level = oeeLevel(totals.oee)
    const productionInShift = totals.time.productionMinutes - totals.time.overtimeMinutes
    const downtime = totals.time.downtimeMinutes
    const unreported = totals.report.unreportedLotCount
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
                <StatsSummaryCard
                    label={level ? `OEE · ${OEE_LEVEL_LABELS[level]}` : "OEE"}
                    value={<OeeBadge oee={totals.oee} className="px-2.5 py-0.5 text-lg" />}
                    hint={totals.oee === null ? "Raporlu vardiya yok" : oeeComponentsText(totals)}
                />
            </div>
            <StatsSummaryCard
                label="Kullanım"
                value={formatRate(totals.utilization)}
                hint={`${formatHours(productionInShift)} üretim / ${formatHours(totals.time.capacityMinutes)} vardiya${totals.time.overtimeMinutes > 0 ? ` · vardiya dışı ${formatHours(totals.time.overtimeMinutes)}` : ""}`}
            />
            <StatsSummaryCard
                label="Duruş (vardiya raporu)"
                value={formatHours(sumValues(totals.report.stopMinutes))}
                hint={`Plansız ${formatHours(unplannedStopMinutes(totals.report.stopMinutes))} · planlı ${formatHours(totals.report.stopMinutes.PLANNED)}`}
            />
            <StatsSummaryCard
                label="Makine duruşu"
                value={formatHours(downtimeMinutesTotal(downtime))}
                hint={`Bakım ${formatHours(downtime.PLANNED_MAINTENANCE)} · arıza ${formatHours(downtime.BREAKDOWN)}${downtime.OTHER > 0 ? ` · diğer ${formatHours(downtime.OTHER)}` : ""}`}
            />
            <StatsSummaryCard
                label="Raporlu vardiya"
                value={formatQuantity(totals.report.reportedLotCount)}
                hint={unreported > 0 ? `${formatQuantity(unreported)} vardiya raporsuz kapandı — süre ve OEE'ye girmedi` : "Kapanan vardiyaların hepsi raporlu"}
                hintTone={unreported > 0 ? "warning" : undefined}
            />
        </div>
    )
}
