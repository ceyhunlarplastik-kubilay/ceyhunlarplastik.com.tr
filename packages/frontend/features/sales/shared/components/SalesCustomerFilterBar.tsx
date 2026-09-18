"use client"

import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import { useManagedProductAttributesForFilter } from "@/features/customerLocations/hooks/useManagedProductAttributesForFilter"

type Props = {
    search: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    sectorValueId: string
    onSectorValueIdChange: (value: string) => void
    usageAreaValueId: string
    onUsageAreaValueIdChange: (value: string) => void
    countryId: number | null
    stateId: number | null
    cityId: number | null
    onGeoChange: (patch: { countryId?: number | null; stateId?: number | null; cityId?: number | null }) => void
    hasFilters: boolean
    onReset: () => void
}

/**
 * Arama + sektör + kullanım alanı + il/ilçe filtre çubuğu — kullanıcı talebiyle
 * "Potansiyel Müşteriler" ve "Cari Müşteriler" sayfaları AYNI filtreleri
 * kullanır, tek bileşenden gelir (`SalesLeadCustomersPageClient` /
 * `SalesActiveCustomersPageClient`). Sektör/kullanım alanı seçenekleri
 * kendi hook'undan (`useManagedProductAttributesForFilter`) gelir — çağıran
 * taraf ayrıca çekmek zorunda değil.
 */
export function SalesCustomerFilterBar({
    search,
    onSearchChange,
    searchPlaceholder = "Firma, yetkili, e-posta veya telefon ara",
    sectorValueId,
    onSectorValueIdChange,
    usageAreaValueId,
    onUsageAreaValueIdChange,
    countryId,
    stateId,
    cityId,
    onGeoChange,
    hasFilters,
    onReset,
}: Props) {
    const attributesQuery = useManagedProductAttributesForFilter()
    const sectorValues = attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? []
    const usageAreaValues =
        attributesQuery.data?.find((attribute) => attribute.code === "usage_area")?.values ?? []

    return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px] lg:items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-11 rounded-2xl pl-9"
                    />
                </div>

                <SearchableSelect
                    aria-label="Sektör"
                    value={sectorValueId || null}
                    onValueChange={(value) => onSectorValueIdChange(value ?? "")}
                    options={sectorValues.map((value) => ({ value: value.id, label: value.name }))}
                    placeholder="Tüm sektörler"
                    searchPlaceholder="Sektör ara"
                    loading={attributesQuery.isLoading}
                />

                <SearchableSelect
                    aria-label="Kullanım alanı"
                    value={usageAreaValueId || null}
                    onValueChange={(value) => onUsageAreaValueIdChange(value ?? "")}
                    options={usageAreaValues.map((value) => ({ value: value.id, label: value.name }))}
                    placeholder="Tüm kullanım alanları"
                    searchPlaceholder="Kullanım alanı ara"
                    loading={attributesQuery.isLoading}
                />
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-center">
                <GeoAddressFilterFields
                    countryId={countryId}
                    stateId={stateId}
                    cityId={cityId}
                    onChange={onGeoChange}
                />

                {hasFilters ? (
                    <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={onReset}>
                        <X className="h-4 w-4" />
                        Temizle
                    </Button>
                ) : null}
            </div>
        </section>
    )
}
