import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LotListItem } from "@/features/production/lots/api/types"
import { LOT_DISPLAY_STATUS_CLASSES, LOT_DISPLAY_STATUS_LABELS, lotDisplayStatus } from "@/features/production/lots/utils/lotExecution"

export function LotDisplayStatusBadge({ lot }: { lot: Pick<LotListItem, "status" | "reportedAt"> }) {
    const status = lotDisplayStatus(lot)
    return <Badge variant="outline" className={cn("rounded-full", LOT_DISPLAY_STATUS_CLASSES[status])}>{LOT_DISPLAY_STATUS_LABELS[status]}</Badge>
}
