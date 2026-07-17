import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getCategories, type GetCategoriesParams } from "../api/getCategories"

const paramsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(500).optional(),
    search: z.string().trim().optional(),
    sort: z.enum(["code", "name", "createdAt"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
})

type Options = {
    params?: GetCategoriesParams
    autoRefreshIntervalMs?: number | false
}

export function useCategories({ params = {}, autoRefreshIntervalMs = false }: Options = {}) {
    const normalizedParams = useMemo(() => paramsSchema.parse(params), [params])

    return useQuery({
        queryKey: ["admin-categories", normalizedParams],
        queryFn: () => getCategories(normalizedParams),
        placeholderData: (previous) => previous,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
