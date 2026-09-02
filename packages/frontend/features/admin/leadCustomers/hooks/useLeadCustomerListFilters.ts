"use client"

import { useDeferredValue, useMemo } from "react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"
import {
    buildLeadCustomerListParams,
    hasActiveLeadCustomerFilters,
} from "@/features/admin/leadCustomers/lib/leadCustomerListParams"

/**
 * Potansiyel müşteri listesi filtreleri — repodaki `use<Feature>ListFilters`
 * deseni (bkz. `useCustomerListFilters`, `useColorListFilters`): TEK
 * `useQueryStates` çağrısı, URL'de paylaşılabilir/geri tuşuna dayanıklı state.
 * Önceden sekiz ayrı `useQueryState` çağrısıydı.
 */
export function useLeadCustomerListFilters() {
    const [state, setState] = useQueryStates({
        q: parseAsString.withDefault(""),
        sector: parseAsString.withDefault(""),
        usage: parseAsString.withDefault(""),
        country: parseAsInteger,
        state: parseAsInteger,
        city: parseAsInteger,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    // Arama her tuş vuruşunda URL'e yazılır (paylaşılabilir kalsın) ama sorguyu
    // her karakterde tetiklemesin diye ertelenmiş değer kullanılır.
    const deferredSearch = useDeferredValue(state.q)

    const filterState = useMemo(
        () => ({
            search: deferredSearch,
            sectorValueId: state.sector,
            usageAreaValueId: state.usage,
            countryId: state.country,
            stateId: state.state,
            cityId: state.city,
            page: state.page,
            limit: state.limit,
        }),
        [deferredSearch, state.sector, state.usage, state.country, state.state, state.city, state.page, state.limit],
    )

    const params = useMemo(() => buildLeadCustomerListParams(filterState), [filterState])
    const hasFilters = useMemo(() => hasActiveLeadCustomerFilters(filterState), [filterState])
    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    return {
        filters: {
            search: state.q,
            sectorValueId: state.sector,
            usageAreaValueId: state.usage,
            countryId: state.country,
            stateId: state.state,
            cityId: state.city,
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        params,
        hasFilters,
        setSearch: (search: string) => setState({ q: search, page: 1 }),
        setSectorValueId: (sectorValueId: string) => setState({ sector: sectorValueId, page: 1 }),
        setUsageAreaValueId: (usageAreaValueId: string) => setState({ usage: usageAreaValueId, page: 1 }),
        setGeo: (patch: { countryId?: number | null; stateId?: number | null; cityId?: number | null }) =>
            setState({
                ...(patch.countryId !== undefined ? { country: patch.countryId } : {}),
                ...(patch.stateId !== undefined ? { state: patch.stateId } : {}),
                ...(patch.cityId !== undefined ? { city: patch.cityId } : {}),
                page: 1,
            }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
        /**
         * Tüm filtreleri (geo dahil) ve sayfayı varsayılana döndürür — hem
         * "Temizle" butonu hem kayıt oluşturma sonrası (`handleCreated`) kullanır.
         * İkincisi ÖNEMLİ: aktif bir il/ilçe filtresi `addresses.some({...})`
         * kısıtı uygular; adressiz yeni bir kayıt bu kısıt açıkken hiçbir zaman
         * eşleşmez. Yalnız metin filtrelerini temizlemek yeterli değildi — bu
         * eski koddaki hataydı. Ülke, sıfırlandıktan sonra `GeoAddressFilterFields`
         * tarafından yine Türkiye'ye ayarlanır.
         */
        reset: () =>
            setState({
                q: "",
                sector: "",
                usage: "",
                country: null,
                state: null,
                city: null,
                page: 1,
            }),
    }
}
