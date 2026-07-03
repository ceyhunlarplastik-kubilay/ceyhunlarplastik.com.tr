"use client"

import { useQuery } from "@tanstack/react-query"
import { listAttributesWithValues } from "../api/listAttributesWithValues"
import { productAttributeKeys } from "@/features/admin/productAttributes/api/productAttributeKeys"

type Options = {
    autoRefreshIntervalMs?: number | false
}

export function useAttributesForFilter({ autoRefreshIntervalMs = false }: Options = {}) {
    return useQuery({
        queryKey: productAttributeKeys.withValues(),
        queryFn: listAttributesWithValues,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
