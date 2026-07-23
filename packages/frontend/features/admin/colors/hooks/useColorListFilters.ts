"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"
import type { ColorSystem } from "@/features/admin/colors/api/types"

const COLOR_SYSTEMS = ["RAL", "PANTONE", "NCS", "CUSTOM"] as const

function parseSystem(value: string): ColorSystem | undefined {
    return COLOR_SYSTEMS.includes(value as ColorSystem)
        ? (value as ColorSystem)
        : undefined
}

export function useColorListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        system: parseAsString.withDefault("all"),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)
    const selectedSystem = parseSystem(state.system)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(selectedSystem ? { system: selectedSystem } : {}),
        }),
        [selectedSystem, state.limit, state.page, state.search],
    )

    return {
        filters: {
            search: state.search,
            system: state.system,
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setSystem: (system: string) => setState({ system, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
