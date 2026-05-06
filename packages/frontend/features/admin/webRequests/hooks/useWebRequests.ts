"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getWebRequests } from "@/features/admin/webRequests/api/getWebRequests"

type Params = {
    page: number
    limit: number
    search?: string
    status?: string
}

const webRequestParamsSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(100),
    search: z.string().trim().optional(),
    status: z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"]).optional(),
})

type Options = {
    params: Params
    autoRefreshIntervalMs?: number | false
}

export function useWebRequests({ params, autoRefreshIntervalMs = false }: Options) {
    const normalizedParams = useMemo(() => webRequestParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-web-requests", normalizedParams],
        queryFn: () => getWebRequests(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
