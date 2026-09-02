import type { ListLeadCustomersParams } from "@/features/admin/leadCustomers/api/types"

/** URL'den gelen ham filtre durumu (nuqs `useQueryStates` çıktısı). */
export type LeadCustomerFilterState = {
    search: string
    sectorValueId: string
    usageAreaValueId: string
    countryId: number | null
    stateId: number | null
    cityId: number | null
    page: number
    limit: number
}

/**
 * Filtre durumundan API sorgu parametrelerini üretir. Boş/varsayılan alanlar
 * sorguya HİÇ eklenmez (query key stabil kalsın, gereksiz alan gitmesin).
 * Saf ve testli — hook bunu `useMemo` ile sarar.
 */
export function buildLeadCustomerListParams(state: LeadCustomerFilterState): ListLeadCustomersParams {
    const search = state.search.trim()

    return {
        page: state.page,
        limit: state.limit,
        ...(search ? { search } : {}),
        ...(state.sectorValueId ? { sectorValueId: state.sectorValueId } : {}),
        ...(state.usageAreaValueId ? { usageAreaValueId: state.usageAreaValueId } : {}),
        ...(state.countryId ? { countryId: state.countryId } : {}),
        ...(state.stateId ? { stateId: state.stateId } : {}),
        ...(state.cityId ? { cityId: state.cityId } : {}),
    }
}

/**
 * "Filtre var mı" — ülke varsayılanı (Türkiye) sayıma GİRMEZ, aksi halde sayfa
 * her açılışta "filtreli" görünür ve boş sonuçta yanlışlıkla "temizle" önerilir.
 */
export function hasActiveLeadCustomerFilters(state: LeadCustomerFilterState): boolean {
    return Boolean(
        state.search.trim() ||
            state.sectorValueId ||
            state.usageAreaValueId ||
            state.stateId ||
            state.cityId,
    )
}
