import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    JOB_STATUS_BORDER_CLASSES,
    JOB_STATUS_FILL_CLASSES,
    JOB_STATUS_LABELS,
    type ProductionJobStatus,
} from "@/features/production/shared/jobStatus"

/** İş durumu rozeti — tahta çubuğu ve pano kartıyla aynı renkler. */
export function JobStatusBadge({ status, className }: { status: ProductionJobStatus; className?: string }) {
    return (
        <Badge
            variant="outline"
            className={cn("rounded-full text-foreground", JOB_STATUS_FILL_CLASSES[status], JOB_STATUS_BORDER_CLASSES[status], className)}
        >
            {JOB_STATUS_LABELS[status]}
        </Badge>
    )
}
