"use client"

import { useState } from "react"
import { Search, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Separator } from "@/components/ui/separator"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import { useLeadCustomerListFilters } from "@/features/admin/leadCustomers/hooks/useLeadCustomerListFilters"
import { LeadCustomerCard } from "@/features/admin/leadCustomers/components/LeadCustomerCard"
import { useManagedProductAttributesForFilter } from "@/features/customerLocations/hooks/useManagedProductAttributesForFilter"
import { useManagedLeadCustomers } from "@/features/sales/leadCustomers/hooks/useManagedLeadCustomers"
import { SalesLeadCustomerDetailPanel } from "@/features/sales/leadCustomers/components/SalesLeadCustomerDetailPanel"

/**
 * Satış tarafı, salt-okunur "Potansiyel Müşteriler" listesi —
 * `LeadCustomersPageClient` (admin/veri girişi) örnek alındı, ama yazma
 * (oluştur/düzenle/sil/toplu seçim) buradan hiç yok: kullanıcı talebiyle
 * "şimdilik hepsini listeleyebilsin" — havuz herkese açık, sahiplik kısıtı
 * yok (`GET /sales/lead-customers`). "Adresler & Eşleşen Ürünler" accordion'u
 * (`showDetailToggle`) VAR ama adres CRUD'u YOK — `SalesLeadCustomerDetailPanel`
 * salt-okunur, `GET /sales/lead-customers/{id}` çağırır.
 */
export function SalesLeadCustomersPageClient() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const {
        filters,
        params,
        hasFilters,
        setSearch,
        setSectorValueId,
        setUsageAreaValueId,
        setGeo,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
        reset,
    } = useLeadCustomerListFilters()

    const attributesQuery = useManagedProductAttributesForFilter()
    const leadsQuery = useManagedLeadCustomers(params, {
        autoRefreshIntervalMs:
            filters.refreshIntervalSeconds > 0 ? filters.refreshIntervalSeconds * 1000 : false,
    })
    const leads = leadsQuery.data?.data ?? []
    const meta = leadsQuery.data?.meta
    const isInitialLoading = leadsQuery.isLoading && leads.length === 0
    const isBackgroundRefreshing = leadsQuery.isFetching && !isInitialLoading

    const sectorValues = attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? []
    const usageAreaValues =
        attributesQuery.data?.find((attribute) => attribute.code === "usage_area")?.values ?? []

    async function handleRefresh() {
        await leadsQuery.refetch()
        toast.success("Liste yenilendi")
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-neutral-950">Potansiyel Müşteriler</h1>
                <p className="text-sm text-neutral-500">
                    Tüm potansiyel müşteri (LEAD) havuzu — henüz hiçbir temsilciye özel bir
                    kısıt yok, tüm kayıtları görebilirsiniz.
                </p>
            </div>

            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px] lg:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={filters.search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Firma, yetkili, e-posta veya telefon ara"
                            className="h-11 rounded-2xl pl-9"
                        />
                    </div>

                    <SearchableSelect
                        aria-label="Sektör"
                        value={filters.sectorValueId || null}
                        onValueChange={(value) => setSectorValueId(value ?? "")}
                        options={sectorValues.map((value) => ({ value: value.id, label: value.name }))}
                        placeholder="Tüm sektörler"
                        searchPlaceholder="Sektör ara"
                        loading={attributesQuery.isLoading}
                    />

                    <SearchableSelect
                        aria-label="Kullanım alanı"
                        value={filters.usageAreaValueId || null}
                        onValueChange={(value) => setUsageAreaValueId(value ?? "")}
                        options={usageAreaValues.map((value) => ({ value: value.id, label: value.name }))}
                        placeholder="Tüm kullanım alanları"
                        searchPlaceholder="Kullanım alanı ara"
                        loading={attributesQuery.isLoading}
                    />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-center">
                    <GeoAddressFilterFields
                        countryId={filters.countryId}
                        stateId={filters.stateId}
                        cityId={filters.cityId}
                        onChange={setGeo}
                    />

                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl"
                            onClick={reset}
                        >
                            <X className="h-4 w-4" />
                            Temizle
                        </Button>
                    ) : null}
                </div>
            </section>

            <AdminListRefreshBar
                dataUpdatedAt={leadsQuery.dataUpdatedAt}
                isFetching={leadsQuery.isFetching}
                onRefresh={handleRefresh}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <Separator />

            <div className="relative">
                <AdminSectionLoadingOverlay isVisible={isBackgroundRefreshing} label="Liste güncelleniyor…" />

                <div aria-busy={leadsQuery.isFetching} className="space-y-3">
                    {isInitialLoading
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-24 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
                            />
                        ))
                        : leads.map((customer) => (
                            <LeadCustomerCard
                                key={customer.id}
                                customer={customer}
                                isExpanded={expandedId === customer.id}
                                onToggle={() => setExpandedId((prev) => (prev === customer.id ? null : customer.id))}
                                onEdit={() => {}}
                                isSelected={false}
                                onToggleSelect={() => {}}
                                onDelete={() => {}}
                                isDeleting={false}
                                canDelete={false}
                                canSelect={false}
                                canEdit={false}
                                showDetailToggle
                                renderDetail={(id) => <SalesLeadCustomerDetailPanel customerId={id} />}
                            />
                        ))}

                    {!isInitialLoading && leads.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                                <UserPlus className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-neutral-950">
                                {hasFilters ? "Filtrelere uyan kayıt yok" : "Henüz potansiyel müşteri yok"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                                {hasFilters
                                    ? "Aramayı veya filtreleri temizleyerek tüm kayıtları görebilirsiniz."
                                    : "Yeni potansiyel müşteri kayıtları burada listelenecek."}
                            </p>
                            {hasFilters ? (
                                <Button type="button" className="mt-4 rounded-2xl" onClick={reset}>
                                    Filtreleri Temizle
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {leads.length > 0 ? (
                <AdminListPagination
                    page={meta?.page ?? filters.page}
                    totalPages={meta?.totalPages ?? 1}
                    total={meta?.total ?? 0}
                    limit={filters.limit}
                    itemLabel="potansiyel müşteri"
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            ) : null}
        </div>
    )
}
