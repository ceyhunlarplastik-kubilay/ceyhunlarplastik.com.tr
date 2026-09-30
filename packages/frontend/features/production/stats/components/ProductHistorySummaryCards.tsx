import type { ProductHistorySummary } from "@/features/production/stats/api/types"
import { cycleDeviation, formatCycle, formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { StatsSummaryCard as SummaryCard } from "./StatsSummaryCard"

/** Pencerenin özeti: üretim, sağlam, fire, çevrim (plan ↔ gerçek), raporlu vardiya. */
export function ProductHistorySummaryCards({ summary }: { summary: ProductHistorySummary }) {
    const deviation = cycleDeviation(summary.actualCycleSec, summary.plannedCycleSec)
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard label="Üretim" value={formatQuantity(summary.jobCount)} hint={`${formatQuantity(summary.rowCount)} satır (aile kalıbında ölçü başına)`} />
            <SummaryCard label="Sağlam" value={formatQuantity(summary.goodQuantity)} hint={`Planlanan ${formatQuantity(summary.plannedQuantity)}`} />
            <SummaryCard
                label="Fire"
                value={formatQuantity(summary.scrapQuantity)}
                hint={`Oran ${formatRate(summary.scrapRate)}`}
                tone={summary.scrapRate !== null && summary.scrapRate > 0.05 ? "warning" : undefined}
            />
            <SummaryCard
                label="Ortalama çevrim"
                value={formatCycle(summary.actualCycleSec)}
                hint={summary.plannedCycleSec === null ? "Raporlu baskı yok" : `Plan ${formatCycle(summary.plannedCycleSec)}${deviation ? ` · ${deviation.text}` : ""}`}
                tone={deviation && deviation.ratio > 0.1 ? "warning" : undefined}
            />
            <SummaryCard label="Raporlu vardiya" value={formatQuantity(summary.reportedLotCount)} hint="Çevrim ve süre bu vardiyalardan" />
        </div>
    )
}
