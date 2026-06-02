"use client"

import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS } from "@/features/orders/config"
import type { OrderStatus } from "@/features/orders/api/types"

const variantMap: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
    APPROVED: "default",
    IN_PRODUCTION: "secondary",
    READY_TO_SHIP: "outline",
    SHIPPED: "outline",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <Badge variant={variantMap[status]}>
            {ORDER_STATUS_LABELS[status]}
        </Badge>
    )
}
