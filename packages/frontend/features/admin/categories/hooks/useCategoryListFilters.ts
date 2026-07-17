"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminPageSize,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export function useCategoryListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const limit = normalizeAdminPageSize(state.limit)
    const filters = useMemo(
        () => ({
            search: state.search,
            page: state.page,
            limit,
            refreshIntervalSeconds,
        }),
        [limit, refreshIntervalSeconds, state.page, state.search]
    )

    const params = useMemo(
        () => ({
            page: state.page,
            limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
        }),
        [limit, state.page, state.search],
    )

    return {
        filters,
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setPage: (page: number) => setState({ page: Math.max(1, page) }),
        setLimit: (nextLimit: number) => setState({ limit: nextLimit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
