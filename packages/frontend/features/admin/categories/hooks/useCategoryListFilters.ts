"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export function useCategoryListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const filters = useMemo(
        () => ({
            search: state.search,
            refreshIntervalSeconds,
        }),
        [refreshIntervalSeconds, state.search]
    )

    return {
        filters,
        setSearch: (search: string) => setState({ search }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
