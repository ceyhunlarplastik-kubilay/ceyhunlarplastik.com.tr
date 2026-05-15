"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import {
    BUSINESS_REQUEST_DOMAIN_VALUES,
    BUSINESS_REQUEST_STATUS_VALUES,
    BUSINESS_REQUEST_TYPE_VALUES,
} from "@/features/businessRequests/config"
import { listBusinessRequests } from "@/features/businessRequests/api/listBusinessRequests"
import type {
    BusinessRequestListScope,
    ListBusinessRequestsParams,
} from "@/features/businessRequests/api/types"

type Options = {
    scope: BusinessRequestListScope
    params?: ListBusinessRequestsParams
    autoRefreshIntervalMs?: number | false
}

const businessRequestParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    status: z.enum(BUSINESS_REQUEST_STATUS_VALUES).optional(),
    type: z.enum(BUSINESS_REQUEST_TYPE_VALUES).optional(),
    domain: z.enum(BUSINESS_REQUEST_DOMAIN_VALUES).optional(),
})

export function useBusinessRequests({ scope, params = {}, autoRefreshIntervalMs = false }: Options) {
    const normalizedParams = useMemo(
        () => businessRequestParamsSchema.parse(params),
        [params],
    )

    return useQuery({
        queryKey: ["business-requests", scope, normalizedParams],
        queryFn: () => listBusinessRequests(scope, normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
