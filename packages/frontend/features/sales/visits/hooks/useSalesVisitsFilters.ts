"use client"

import { useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import {
    ADMIN_LIST_PAGE_SIZE_OPTIONS,
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
} from "@/features/admin/shared/config"
import type {
    CustomerVisitOutcome,
    CustomerVisitStatus,
    CustomerVisitType,
} from "@/features/admin/customers/api/types"

/**
 * `/satis/ziyaretlerim` filtre/sayfalama durumu — URL'de kalıcı (nuqs), sayfa
 * paylaşılabilir/geri tuşu çalışır. Yalnız backend'in `listVisitsForReport`
 * (Dilim 1) zaten desteklediği alanlar: durum/tür/sonuç/tarih aralığı/il-ilçe.
 * `countryId` yalnız `GeoAddressFilterFields`'in il/ilçe kademesini beslemek
 * için tutulur — ucun kendisi ülke filtresi almaz.
 */
export function useSalesVisitsFilters() {
    const [state, setState] = useQueryStates({
        status: parseAsString,
        type: parseAsString,
        outcome: parseAsString,
        scheduledFrom: parseAsString,
        scheduledTo: parseAsString,
        countryId: parseAsInteger,
        stateId: parseAsInteger,
        cityId: parseAsInteger,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
    })

    const params = useMemo(
        () => ({
            page: state.page,
            limit: state.limit,
            ...(state.status ? { status: state.status as CustomerVisitStatus } : {}),
            ...(state.type ? { type: state.type as CustomerVisitType } : {}),
            ...(state.outcome ? { outcome: state.outcome as CustomerVisitOutcome } : {}),
            ...(state.scheduledFrom ? { scheduledFrom: state.scheduledFrom } : {}),
            ...(state.scheduledTo ? { scheduledTo: state.scheduledTo } : {}),
            ...(state.stateId ? { stateId: state.stateId } : {}),
            ...(state.cityId ? { cityId: state.cityId } : {}),
        }),
        [
            state.page,
            state.limit,
            state.status,
            state.type,
            state.outcome,
            state.scheduledFrom,
            state.scheduledTo,
            state.stateId,
            state.cityId,
        ],
    )

    const hasActiveFilters = Boolean(
        state.status
        || state.type
        || state.outcome
        || state.scheduledFrom
        || state.scheduledTo
        || state.stateId
        || state.cityId,
    )

    return {
        filters: {
            status: state.status ?? "",
            type: state.type ?? "",
            outcome: state.outcome ?? "",
            scheduledFrom: state.scheduledFrom ?? "",
            scheduledTo: state.scheduledTo ?? "",
            countryId: state.countryId,
            stateId: state.stateId,
            cityId: state.cityId,
            page: state.page,
            limit: state.limit,
            hasActiveFilters,
        },
        params,
        limitOptions: ADMIN_LIST_PAGE_SIZE_OPTIONS,
        setStatus: (status: string) => setState({ status: status || null, page: 1 }),
        setType: (type: string) => setState({ type: type || null, page: 1 }),
        setOutcome: (outcome: string) => setState({ outcome: outcome || null, page: 1 }),
        setScheduledFrom: (scheduledFrom: string) => setState({ scheduledFrom: scheduledFrom || null, page: 1 }),
        setScheduledTo: (scheduledTo: string) => setState({ scheduledTo: scheduledTo || null, page: 1 }),
        setGeo: (patch: { countryId?: number | null; stateId?: number | null; cityId?: number | null }) =>
            setState({ ...patch, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        clearAll: () =>
            setState({
                status: null,
                type: null,
                outcome: null,
                scheduledFrom: null,
                scheduledTo: null,
                countryId: null,
                stateId: null,
                cityId: null,
                page: 1,
            }),
    }
}
