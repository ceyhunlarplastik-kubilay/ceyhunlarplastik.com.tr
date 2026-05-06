"use client"

import { useMemo } from "react"
import {
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryStates,
} from "nuqs"
import {
    DEFAULT_SUPPLIER_APPROVAL_REQUEST_PAGE_SIZE,
    DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS,
    SUPPLIER_APPROVAL_REQUEST_STATUS_VALUES,
    SUPPLIER_APPROVAL_REQUEST_TYPE_VALUES,
    normalizeSupplierApprovalRefreshInterval,
} from "@/features/admin/supplierApprovalRequests/config"

const statusParser = parseAsStringLiteral(SUPPLIER_APPROVAL_REQUEST_STATUS_VALUES)
const typeParser = parseAsStringLiteral(SUPPLIER_APPROVAL_REQUEST_TYPE_VALUES)

export function useSupplierApprovalRequestFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        status: statusParser,
        type: typeParser,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_SUPPLIER_APPROVAL_REQUEST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeSupplierApprovalRefreshInterval(state.refresh)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(state.status ? { status: state.status } : {}),
            ...(state.type ? { type: state.type } : {}),
        }),
        [state.limit, state.page, state.search, state.status, state.type]
    )

    return {
        filters: {
            search: state.search,
            status: state.status ?? "",
            type: state.type ?? "",
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setStatus: (status: string) =>
            setState({ status: (status || null) as typeof state.status, page: 1 }),
        setType: (type: string) =>
            setState({ type: (type || null) as typeof state.type, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeSupplierApprovalRefreshInterval(refresh) }),
    }
}
