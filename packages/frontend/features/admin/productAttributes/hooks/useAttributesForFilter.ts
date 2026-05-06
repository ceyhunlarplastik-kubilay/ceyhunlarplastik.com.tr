"use client"

import { useQuery } from "@tanstack/react-query"
import { listAttributesWithValues } from "../api/listAttributesWithValues"

type Options = {
    autoRefreshIntervalMs?: number | false
}

export function useAttributesForFilter({ autoRefreshIntervalMs = false }: Options = {}) {
    return useQuery({
        queryKey: ["product-attributes-filter"],
        queryFn: listAttributesWithValues,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
