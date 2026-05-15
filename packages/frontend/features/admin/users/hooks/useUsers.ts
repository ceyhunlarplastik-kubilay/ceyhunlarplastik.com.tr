"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { getUsers } from "@/features/admin/users/api/getUsers"

type Params = {
    page: number
    limit: number
    search?: string
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
}

const userParamsSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(500),
    search: z.string().trim().optional(),
    accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
})

type Options = {
    params: Params
    autoRefreshIntervalMs?: number | false
}

export function useUsers({ params, autoRefreshIntervalMs = false }: Options) {
    const normalizedParams = useMemo(() => userParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-users", normalizedParams],
        queryFn: () => getUsers(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
