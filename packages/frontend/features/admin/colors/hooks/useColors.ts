"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getColors, type GetColorsParams } from "@/features/admin/colors/api/getColors"

const colorParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    system: z.enum(["RAL", "PANTONE", "NCS", "CUSTOM"]).optional(),
})

type Options = {
    params?: GetColorsParams
    autoRefreshIntervalMs?: number | false
}

export function useColors({ params = {}, autoRefreshIntervalMs = false }: Options = {}) {
    const normalizedParams = useMemo(() => colorParamsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-colors", normalizedParams],
        queryFn: () => getColors(normalizedParams),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
