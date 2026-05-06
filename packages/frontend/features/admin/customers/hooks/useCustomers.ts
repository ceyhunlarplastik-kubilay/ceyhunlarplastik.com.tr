"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getCustomers } from "@/features/admin/customers/api/getCustomers"

type Params = {
    page: number
    limit: number
    search?: string
    sectorValueId?: string
    productionGroupValueId?: string
    usageAreaValueId?: string
}

const customerParamsSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    search: z.string().trim().optional(),
    sectorValueId: z.string().trim().optional(),
    productionGroupValueId: z.string().trim().optional(),
    usageAreaValueId: z.string().trim().optional(),
})

type Options = {
    params: Params
    autoRefreshIntervalMs?: number | false
}

export function useCustomers({ params, autoRefreshIntervalMs = false }: Options) {
    const normalizedParams = useMemo(() => customerParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-customers", normalizedParams],
        queryFn: () => getCustomers(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
