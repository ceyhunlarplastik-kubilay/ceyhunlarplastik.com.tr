"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    normalizeAdminPageSize,
} from "@/features/admin/shared/config"
import type { IndustrialUsageAssignmentFilter } from "@/features/admin/industrialUsageAssignments/api/types"

const assignmentParser = parseAsStringLiteral(["all", "assigned", "unassigned"])

export function useIndustrialUsageAssignmentFilters() {
    const [state, setState] = useQueryStates({
        sectorValueId: parseAsString,
        productionGroupValueId: parseAsString,
        usageAreaValueId: parseAsString,
        search: parseAsString.withDefault(""),
        assignment: assignmentParser.withDefault("all"),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
    })

    const limit = normalizeAdminPageSize(state.limit)

    const params = useMemo(
        () => ({
            page: state.page,
            limit,
            assignment: state.assignment as IndustrialUsageAssignmentFilter,
            ...(state.search.trim() ? { search: state.search.trim() } : {}),
        }),
        [limit, state.assignment, state.page, state.search],
    )

    return {
        filters: {
            sectorValueId: state.sectorValueId ?? "",
            productionGroupValueId: state.productionGroupValueId ?? "",
            usageAreaValueId: state.usageAreaValueId ?? "",
            search: state.search,
            assignment: state.assignment as IndustrialUsageAssignmentFilter,
            page: state.page,
            limit,
        },
        params,
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
            setState({
                usageAreaValueId: usageAreaValueId || null,
                page: 1,
            }),
        setHierarchySelection: ({
            sectorValueId,
            productionGroupValueId,
            usageAreaValueId,
        }: {
            sectorValueId?: string | null
            productionGroupValueId?: string | null
            usageAreaValueId?: string | null
        }) =>
            setState({
                sectorValueId: sectorValueId || null,
                productionGroupValueId: productionGroupValueId || null,
                usageAreaValueId: usageAreaValueId || null,
                page: 1,
            }),
        setSearch: (search: string) => setState({ search, page: 1 }),
        setAssignment: (assignment: IndustrialUsageAssignmentFilter) =>
            setState({ assignment, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (nextLimit: number) =>
            setState({
                limit: normalizeAdminPageSize(nextLimit),
                page: 1,
            }),
        clearProductFilters: () =>
            setState({
                search: "",
                assignment: "all",
                page: 1,
            }),
    }
}
