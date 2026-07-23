"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"
import {
    MEASUREMENT_TYPE_CODES,
    type MeasurementTypeCode,
} from "@/features/admin/measurementTypes/api/types"

function parseMeasurementCode(value: string): MeasurementTypeCode | undefined {
    return MEASUREMENT_TYPE_CODES.includes(value as MeasurementTypeCode)
        ? (value as MeasurementTypeCode)
        : undefined
}

export function useMeasurementTypeListFilters() {
    const [state, setState] = useQueryStates({
        search: parseAsString.withDefault(""),
        code: parseAsString.withDefault("all"),
        baseUnit: parseAsString.withDefault(""),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)
    const selectedCode = parseMeasurementCode(state.code)

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
            ...(selectedCode ? { code: selectedCode } : {}),
            ...(state.baseUnit.trim() ? { baseUnit: state.baseUnit.trim() } : {}),
        }),
        [selectedCode, state.baseUnit, state.limit, state.page, state.search],
    )

    return {
        filters: {
            search: state.search,
            code: state.code,
            baseUnit: state.baseUnit,
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        setSearch: (search: string) => setState({ search, page: 1 }),
        setCode: (code: string) => setState({ code, page: 1 }),
        setBaseUnit: (baseUnit: string) => setState({ baseUnit, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
    }
}
