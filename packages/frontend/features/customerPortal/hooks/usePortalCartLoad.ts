"use client"

import { useMemo } from "react"

import {
    summarizePortalCartLoad,
    type PortalCartLoadItem,
} from "@/features/customerPortal/logistics/cartLoad"
import { usePortalCartLogistics } from "@/features/customerPortal/hooks/usePortalCartLogistics"

export function usePortalCartLoad(items: readonly PortalCartLoadItem[]) {
    const logisticsQuery = usePortalCartLogistics(items)
    const summary = useMemo(
        () => summarizePortalCartLoad(items, logisticsQuery.data ?? []),
        [items, logisticsQuery.data],
    )

    return { logisticsQuery, summary }
}
