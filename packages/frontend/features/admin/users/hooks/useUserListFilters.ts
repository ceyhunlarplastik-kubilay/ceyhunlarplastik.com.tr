"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

const userAccessStatusParser = parseAsStringLiteral(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"])

export function useUserListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
        accessStatus: userAccessStatusParser,
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(state.accessStatus ? { accessStatus: state.accessStatus } : {}),
        }),
        [state.accessStatus, state.limit, state.page, state.search]
    )

    return {
        filters: {
            search: state.search,
            page: state.page,
            limit: state.limit,
            accessStatus: state.accessStatus,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setAccessStatus: (accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "") =>
            setState({ accessStatus: accessStatus || null, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
