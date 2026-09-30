import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OEE_LEVEL_CLASS, OEE_LEVEL_LABELS, oeeLevel } from "@/features/production/stats/lib/machineStatsFormat"
import { formatRate } from "@/features/production/stats/lib/productHistoryFormat"

/** OEE yüzdesi, seviyesine göre renkli (≥ %85 iyi, %60–85 orta, altı düşük); veri yoksa "—". */
export function OeeBadge({ oee, className }: { oee: number | null; className?: string }) {
    const level = oeeLevel(oee)
    if (!level) return <span className="text-muted-foreground">—</span>
    return (
        <Badge variant="outline" className={cn("rounded-full tabular-nums", OEE_LEVEL_CLASS[level], className)} title={`OEE seviyesi: ${OEE_LEVEL_LABELS[level]}`}>
            {formatRate(oee)}
        </Badge>
    )
}
