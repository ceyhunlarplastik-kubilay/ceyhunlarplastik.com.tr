"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export function useProductAttributeListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        code: parseAsString,
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const filters = useMemo(
        () => ({
            search: state.search,
            code: state.code ?? "",
            refreshIntervalSeconds,
        }),
        [refreshIntervalSeconds, state.code, state.search]
    )

    return {
        filters,
        setSearch: (search: string) => setState({ search }),
        setCode: (code: string) => setState({ code: code || null }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
