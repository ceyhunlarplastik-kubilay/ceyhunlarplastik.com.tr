"use client"

import { Loader2, MapPinned, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Separator } from "@/components/ui/separator"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"

export type CustomerMapFilters = {
    search: string
    /** `"ALL"` = tüm durumlar. */
    status: "ALL" | "LEAD" | "CUSTOMER"
    /** `"ALL"` = tüm temsilciler; aksi halde kullanıcı id'si. */
    assignedSalesUserId: string
    /** `""` = tüm sektörler. */
    sectorValueId: string
    /** `""` = tüm kullanım alanları. */
    usageAreaValueId: string
    countryId: number | null
    stateId: number | null
    cityId: number | null
}

type Props = {
    filters: CustomerMapFilters
    onChange: (patch: Partial<CustomerMapFilters>) => void
    onApply: () => void
    onClear: () => void
    /** Filtreler değişti ama henüz haritaya uygulanmadı. */
    isDirty: boolean
    /** En az bir kez "Haritada Göster" ile segment yüklendi. */
    isApplied: boolean
    isFetching: boolean
    resultCount: number
    atResultLimit: boolean
    allowSalesFilter: boolean
    salesUsers: Array<{ id: string; label: string }>
    sectorValues: Array<{ id: string; name: string }>
    usageAreaValues: Array<{ id: string; name: string }>
}

/**
 * Müşteri haritası segment filtresi. UI/UX yerleşimi "Potansiyel Müşteriler"
 * sayfasındaki filtre bölümünden alındı (yuvarlak inputlar, ayrı satırda geo
 * alanları, sağda temizle). Buradaki fark: seçimler haritaya OTOMATİK yansımaz;
 * kullanıcı bilinçli olarak "Haritada Göster"e basınca yüklenir — Google harita
 * yükü ve gereksiz istek azaltılır.
 */
export function CustomerMapFilterBar({
    filters,
    onChange,
    onApply,
    onClear,
    isDirty,
    isApplied,
    isFetching,
    resultCount,
    atResultLimit,
    allowSalesFilter,
    salesUsers,
    sectorValues,
    usageAreaValues,
}: Props) {
    // Ülke varsayılanı Türkiye olduğu için "filtre var mı" sayımına GİRMEZ
    // (LeadCustomers deseni) — aksi halde sayfa her açılışta "filtreli" görünür.
    const hasFilters = Boolean(
        filters.search.trim()
        || filters.status !== "ALL"
        || (allowSalesFilter && filters.assignedSalesUserId !== "ALL")
        || filters.sectorValueId
        || filters.usageAreaValueId
        || filters.stateId
        || filters.cityId,
    )

    return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-neutral-950">Segment Filtresi</h2>
                <p className="text-sm text-neutral-500">
                    Ülke/il/ilçe, sektör, kullanım alanı ve temsilci seçip{" "}
                    <span className="font-medium text-neutral-700">Haritada Göster</span>&apos;e basın —
                    müşteri konumları yalnız o zaman yüklenir.
                </p>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={filters.search}
                        onChange={(event) => onChange({ search: event.target.value })}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                onApply()
                            }
                        }}
                        placeholder="Firma, kişi veya e-posta ara"
                        className="h-11 rounded-2xl pl-9"
                    />
                </div>

                <SearchableSelect
                    aria-label="Durum"
                    value={filters.status === "ALL" ? null : filters.status}
                    onValueChange={(value) =>
                        onChange({ status: (value as CustomerMapFilters["status"]) ?? "ALL" })
                    }
                    options={[
                        { value: "CUSTOMER", label: "Müşteriler" },
                        { value: "LEAD", label: "Potansiyeller" },
                    ]}
                    placeholder="Tüm durumlar"
                    searchPlaceholder="Durum ara"
                />

                {allowSalesFilter ? (
                    <SearchableSelect
                        aria-label="Satış temsilcisi"
                        value={filters.assignedSalesUserId === "ALL" ? null : filters.assignedSalesUserId}
                        onValueChange={(value) => onChange({ assignedSalesUserId: value ?? "ALL" })}
                        options={salesUsers.map((user) => ({ value: user.id, label: user.label }))}
                        placeholder="Tüm temsilciler"
                        searchPlaceholder="Temsilci ara"
                    />
                ) : null}

                <SearchableSelect
                    aria-label="Sektör"
                    value={filters.sectorValueId || null}
                    onValueChange={(value) => onChange({ sectorValueId: value ?? "" })}
                    options={sectorValues.map((value) => ({ value: value.id, label: value.name }))}
                    placeholder="Tüm sektörler"
                    searchPlaceholder="Sektör ara"
                />

                <SearchableSelect
                    aria-label="Kullanım alanı"
                    value={filters.usageAreaValueId || null}
                    onValueChange={(value) => onChange({ usageAreaValueId: value ?? "" })}
                    options={usageAreaValues.map((value) => ({ value: value.id, label: value.name }))}
                    placeholder="Tüm kullanım alanları"
                    searchPlaceholder="Kullanım alanı ara"
                />
            </div>

            {/* Adres filtresi kendi satırında (LeadCustomers deseni): üç geo alanı
                üstteki ızgaraya sıkışınca sarma bozuluyor. */}
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <GeoAddressFilterFields
                    countryId={filters.countryId}
                    stateId={filters.stateId}
                    cityId={filters.cityId}
                    onChange={(patch) => onChange(patch)}
                />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-500">
                    {isDirty ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Filtreler değişti — güncellemek için Haritada Göster&apos;e basın
                        </span>
                    ) : isApplied ? (
                        <span>
                            Haritada <span className="font-semibold text-neutral-900">{resultCount}</span> müşteri
                            {atResultLimit ? " (ilk 500 — segmenti daraltın)" : ""}
                        </span>
                    ) : (
                        <span>Henüz segment yüklenmedi.</span>
                    )}
                </div>

                <div className="flex gap-2">
                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl"
                            onClick={onClear}
                        >
                            <X className="h-4 w-4" />
                            Temizle
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        className="h-11 rounded-2xl"
                        onClick={onApply}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MapPinned className="h-4 w-4" />
                        )}
                        Haritada Göster
                    </Button>
                </div>
            </div>
        </section>
    )
}
