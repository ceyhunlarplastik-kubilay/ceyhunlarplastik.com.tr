import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../api/getCategories"

type Options = {
    autoRefreshIntervalMs?: number | false
}

export function useCategories({ autoRefreshIntervalMs = false }: Options = {}) {
    return useQuery({
        queryKey: ["admin-categories"],
        queryFn: getCategories,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
