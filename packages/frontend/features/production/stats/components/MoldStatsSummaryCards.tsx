import type { MoldStatsSummary } from "@/features/production/stats/api/types"
import { formatQuantity, formatRate } from "@/features/production/stats/lib/productHistoryFormat"
import { StatsSummaryCard } from "./StatsSummaryCard"

/** Pencerenin özeti: kullanılan kalıp, baskı, fire, bakım uyarısı, çevrim önerisi. */
export function MoldStatsSummaryCards({ summary }: { summary: MoldStatsSummary }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatsSummaryCard
                label="Kullanılan kalıp"
                value={formatQuantity(summary.usedMoldCount)}
                hint={`${formatQuantity(summary.moldCount)} kalıptan aralıkta raporlu vardiyası olan`}
            />
            <StatsSummaryCard label="Baskı" value={formatQuantity(summary.shots)} hint={`${formatQuantity(summary.reportedLotCount)} raporlu vardiya`} />
            <StatsSummaryCard
                label="Fire"
                value={formatRate(summary.scrapRate)}
                hint={`${formatQuantity(summary.scrapQuantity)} / ${formatQuantity(summary.goodQuantity + summary.scrapQuantity)} adet`}
                tone={summary.scrapRate !== null && summary.scrapRate > 0.05 ? "warning" : undefined}
            />
            <StatsSummaryCard
                label="Bakım uyarısı"
                value={formatQuantity(summary.maintenanceAlertCount)}
                hint="Yaklaşan, gelen ya da planlı işlerle aşılacak"
                tone={summary.maintenanceAlertCount > 0 ? "warning" : undefined}
            />
            <div className="col-span-2 lg:col-span-1">
                <StatsSummaryCard
                    label="Çevrim önerisi"
                    value={formatQuantity(summary.suggestionCount)}
                    hint="Makine kartından en az %5 farklı (en az 3 raporlu vardiya)"
                />
            </div>
        </div>
    )
}
