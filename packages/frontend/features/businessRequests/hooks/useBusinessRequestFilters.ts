"use client"

import { useMemo } from "react"
import {
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryStates,
} from "nuqs"
import {
    BUSINESS_REQUEST_DOMAIN_VALUES,
    BUSINESS_REQUEST_STATUS_VALUES,
    BUSINESS_REQUEST_TYPE_VALUES,
    DEFAULT_BUSINESS_REQUEST_PAGE_SIZE,
    DEFAULT_BUSINESS_REQUEST_REFRESH_INTERVAL_SECONDS,
    normalizeBusinessRequestRefreshInterval,
} from "@/features/businessRequests/config"

const statusParser = parseAsStringLiteral(BUSINESS_REQUEST_STATUS_VALUES)
const typeParser = parseAsStringLiteral(BUSINESS_REQUEST_TYPE_VALUES)
const domainParser = parseAsStringLiteral(BUSINESS_REQUEST_DOMAIN_VALUES)

type Options = {
    defaultStatus?: (typeof BUSINESS_REQUEST_STATUS_VALUES)[number] | ""
    defaultDomain?: (typeof BUSINESS_REQUEST_DOMAIN_VALUES)[number] | ""
    defaultType?: (typeof BUSINESS_REQUEST_TYPE_VALUES)[number] | ""
}

export function useBusinessRequestFilters(options: Options = {}) {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        status: options.defaultStatus ? statusParser.withDefault(options.defaultStatus) : statusParser,
        type: options.defaultType ? typeParser.withDefault(options.defaultType) : typeParser,
        domain: options.defaultDomain ? domainParser.withDefault(options.defaultDomain) : domainParser,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_BUSINESS_REQUEST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_BUSINESS_REQUEST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeBusinessRequestRefreshInterval(state.refresh)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(state.status ? { status: state.status } : {}),
            ...(state.type ? { type: state.type } : {}),
            ...(state.domain ? { domain: state.domain } : {}),
        }),
        [state.domain, state.limit, state.page, state.search, state.status, state.type],
    )

    return {
        filters: {
            search: state.search,
            status: state.status ?? "",
            type: state.type ?? "",
            domain: state.domain ?? "",
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setStatus: (status: string) => setState({ status: (status || null) as typeof state.status, page: 1 }),
        setType: (type: string) => setState({ type: (type || null) as typeof state.type, page: 1 }),
        setDomain: (domain: string) => setState({ domain: (domain || null) as typeof state.domain, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeBusinessRequestRefreshInterval(refresh) }),
    }
}
