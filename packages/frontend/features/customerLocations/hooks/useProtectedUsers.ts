"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getProtectedUsers } from "@/features/customerLocations/api/getProtectedUsers"

const userParamsSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive().max(500),
    search: z.string().trim().optional(),
    accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
})

type Params = z.input<typeof userParamsSchema>

export function useProtectedUsers(params: Params, enabled = true) {
    const normalized = useMemo(() => userParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["protected-users", normalized],
        queryFn: () => getProtectedUsers(normalized),
        enabled,
        refetchOnWindowFocus: true,
    })
}
