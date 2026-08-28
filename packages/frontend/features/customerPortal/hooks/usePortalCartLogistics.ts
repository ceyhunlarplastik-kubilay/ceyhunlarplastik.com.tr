"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { getPortalCartLogistics } from "@/features/customerPortal/api/getPortalCartLogistics"
import {
    normalizePortalCartVariantIds,
    selectPortalCartVariantIds,
    type PortalCartLoadItem,
} from "@/features/customerPortal/logistics/cartLoad"

export const PORTAL_CART_LOGISTICS_STALE_TIME_MS = 5 * 60 * 1000

export function portalCartLogisticsQueryKey(variantIds: readonly string[]) {
    return ["customer-portal", "cart-logistics", normalizePortalCartVariantIds(variantIds)] as const
}

export function usePortalCartLogistics(items: readonly PortalCartLoadItem[]) {
    const variantIds = useMemo(
        () => selectPortalCartVariantIds(items),
        [items],
    )

    return useQuery({
        queryKey: portalCartLogisticsQueryKey(variantIds),
        queryFn: () => getPortalCartLogistics(variantIds),
        enabled: variantIds.length > 0,
        staleTime: PORTAL_CART_LOGISTICS_STALE_TIME_MS,
        refetchOnWindowFocus: true,
    })
}
