"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

export function useCustomerListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        sectorValueId: parseAsString,
        productionGroupValueId: parseAsString,
        usageAreaValueId: parseAsString,
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
            ...(state.sectorValueId ? { sectorValueId: state.sectorValueId } : {}),
            ...(state.productionGroupValueId ? { productionGroupValueId: state.productionGroupValueId } : {}),
            ...(state.usageAreaValueId ? { usageAreaValueId: state.usageAreaValueId } : {}),
        }),
        [
            state.limit,
            state.page,
            state.productionGroupValueId,
            state.search,
            state.sectorValueId,
            state.usageAreaValueId,
        ]
    )

    return {
        filters: {
            search: state.search,
            sectorValueId: state.sectorValueId ?? "",
            productionGroupValueId: state.productionGroupValueId ?? "",
            usageAreaValueId: state.usageAreaValueId ?? "",
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setSectorValueId: (sectorValueId: string) =>
            setState({
                sectorValueId: sectorValueId || null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                page: 1,
            }),
        setProductionGroupValueId: (productionGroupValueId: string) =>
            setState({
                productionGroupValueId: productionGroupValueId || null,
                usageAreaValueId: null,
                page: 1,
            }),
        setUsageAreaValueId: (usageAreaValueId: string) =>
            setState({ usageAreaValueId: usageAreaValueId || null, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
