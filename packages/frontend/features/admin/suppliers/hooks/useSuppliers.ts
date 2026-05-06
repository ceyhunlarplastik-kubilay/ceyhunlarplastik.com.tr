"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getSuppliers } from "@/features/admin/suppliers/api/getSuppliers"

type Params = {
    page: number
    limit: number
    search?: string
}

const supplierParamsSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(500),
    search: z.string().trim().optional(),
})

type Options = {
    params: Params
    autoRefreshIntervalMs?: number | false
}

export function useSuppliers({ params, autoRefreshIntervalMs = false }: Options) {
    const normalizedParams = useMemo(() => supplierParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-suppliers", normalizedParams],
        queryFn: () => getSuppliers(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
