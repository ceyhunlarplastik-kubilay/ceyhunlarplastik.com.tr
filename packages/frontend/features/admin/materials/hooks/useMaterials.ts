"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getMaterials, type GetMaterialsParams } from "@/features/admin/materials/api/getMaterials"

const materialParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    certificateOnly: z.boolean().optional(),
})

type Options = {
    params?: GetMaterialsParams
    autoRefreshIntervalMs?: number | false
}

export function useMaterials({ params = {}, autoRefreshIntervalMs = false }: Options = {}) {
    const normalizedParams = useMemo(() => materialParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-materials", normalizedParams],
        queryFn: () => getMaterials(normalizedParams),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
