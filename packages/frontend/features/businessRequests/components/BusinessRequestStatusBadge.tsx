"use client"

import { Badge } from "@/components/ui/badge"
import { BUSINESS_REQUEST_STATUS_LABELS } from "@/features/businessRequests/config"
import type { BusinessRequestStatus } from "@/features/businessRequests/api/types"

const statusVariantMap: Record<BusinessRequestStatus, "default" | "secondary" | "outline" | "destructive"> = {
    DRAFT: "outline",
    PENDING_APPROVAL: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
    CANCELLED: "outline",
    COMPLETED: "default",
    FAILED: "destructive",
}

export function BusinessRequestStatusBadge({ status }: { status: BusinessRequestStatus }) {
    return <Badge variant={statusVariantMap[status]}>{BUSINESS_REQUEST_STATUS_LABELS[status]}</Badge>
}
