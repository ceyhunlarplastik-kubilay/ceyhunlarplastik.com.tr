"use client"

import { useMemo } from "react"
import {
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryStates,
} from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export const WEB_REQUEST_STATUS_VALUES = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"] as const

const statusParser = parseAsStringLiteral(WEB_REQUEST_STATUS_VALUES)

export function useWebRequestListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        status: statusParser,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(state.status ? { status: state.status } : {}),
        }),
        [state.limit, state.page, state.search, state.status]
    )

    return {
        filters: {
            search: state.search,
            status: state.status ?? "",
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setStatus: (status: string) => setState({ status: (status || null) as typeof state.status, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
