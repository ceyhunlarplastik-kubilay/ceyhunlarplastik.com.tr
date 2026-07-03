"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminPageSize,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export function useProductAttributeListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        code: parseAsString,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)
    const limit = normalizeAdminPageSize(state.limit)

    const filters = useMemo(
        () => ({
            search: state.search,
            code: state.code ?? "",
            page: Math.max(1, state.page),
            limit,
            refreshIntervalSeconds,
        }),
        [limit, refreshIntervalSeconds, state.code, state.page, state.search]
    )

    return {
        filters,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setCode: (code: string) => setState({ code: code || null, page: 1 }),
        setPage: (page: number) => setState({ page: Math.max(1, page) }),
        setLimit: (nextLimit: number) => setState({ limit: normalizeAdminPageSize(nextLimit), page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
