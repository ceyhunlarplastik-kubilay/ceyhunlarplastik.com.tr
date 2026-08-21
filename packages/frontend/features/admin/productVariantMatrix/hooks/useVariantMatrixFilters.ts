"use client"

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import {
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    normalizeAdminRefreshInterval,
} from "@/features/admin/shared/config"

/**
 * Kayıtlı varyant listesinin filtre + sayfalama durumu URL'de tutulur (nuqs):
 * operatör bir satırı düzeltmek için ekranı paylaşabiliyor, tarayıcı geri tuşu
 * filtreyi koruyor ve sayfa yenilenince seçim kaybolmuyor.
 *
 * Filtreleme İSTEMCİDE yapılır: matris ucu tek ürünün tüm satırlarını döndürür
 * (ürün başına birkaç yüz satır) ve bu veri zaten ekranda. Her filtre için sunucuya
 * gitmek gereksiz gecikme olurdu.
 */
export function useVariantMatrixFilters() {
    const [state, setState] = useQueryStates({
        q: parseAsString.withDefault(""),
        supplierId: parseAsString,
        colorId: parseAsString,
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE),
        refresh: parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS),
    })

    const refreshIntervalSeconds = normalizeAdminRefreshInterval(state.refresh)

    const hasActiveFilters = Boolean(state.q.trim() || state.supplierId || state.colorId)

    return {
        filters: {
            q: state.q,
            supplierId: state.supplierId ?? "",
            colorId: state.colorId ?? "",
            page: state.page,
            limit: state.limit,
            refreshIntervalSeconds,
        },
        hasActiveFilters,
        // Her filtre değişiminde sayfa 1'e döner; aksi hâlde 5. sayfadayken
        // filtreleyip boş ekran görülürdü.
        setQuery: (q: string) => setState({ q, page: 1 }),
        setSupplierId: (supplierId: string) => setState({ supplierId: supplierId || null, page: 1 }),
        setColorId: (colorId: string) => setState({ colorId: colorId || null, page: 1 }),
        setPage: (page: number) => setState({ page }),
        setLimit: (limit: number) => setState({ limit, page: 1 }),
        setRefreshIntervalSeconds: (refresh: number) =>
            setState({ refresh: normalizeAdminRefreshInterval(refresh) }),
        clearFilters: () => setState({ q: "", supplierId: null, colorId: null, page: 1 }),
    }
}
