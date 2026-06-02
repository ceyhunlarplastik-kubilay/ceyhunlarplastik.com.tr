"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { DEFAULT_ORDER_PAGE_SIZE, ORDER_STATUS_VALUES } from "@/features/orders/config"

const statusParser = parseAsStringLiteral(ORDER_STATUS_VALUES)

export function useOrderFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        status: statusParser,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ORDER_PAGE_SIZE),
    })

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(state.status ? { status: state.status } : {}),
        }),
        [state.limit, state.page, state.search, state.status],
    )

    return {
        filters: {
            search: state.search,
            status: state.status ?? "",
            page: state.page,
            limit: state.limit,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setStatus: (status: string) => setState({ status: (status || null) as typeof state.status, page: 1 }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setPage: (page: number) => setState({ page }),
    }
}
