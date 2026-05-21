"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getProducts, type GetProductsParams } from "@/features/admin/products/api/getProducts"

const productParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    categoryId: z.string().trim().optional(),
})

type Options = {
    params?: GetProductsParams
    autoRefreshIntervalMs?: number | false
    enabled?: boolean
}

export function useProducts({ params = {}, autoRefreshIntervalMs = false, enabled = true }: Options = {}) {
    const normalizedParams = useMemo(() => productParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-products", normalizedParams],
        queryFn: () => getProducts(normalizedParams),
        placeholderData: (prev) => prev,
        enabled: enabled && normalizedParams.limit !== 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
