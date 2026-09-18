"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useCustomerListFilters } from "@/features/admin/customers/hooks/useCustomerListFilters"
import { useManagedCustomers } from "@/features/sales/customers/hooks/useManagedCustomers"
import { SalesActiveCustomerCard } from "@/features/sales/customers/components/SalesActiveCustomerCard"
import { SalesCustomerFilterBar } from "@/features/sales/shared/components/SalesCustomerFilterBar"

/**
 * "Cari Müşteriler" — satış temsilcisinin KENDİSİNE atanmış, status=CUSTOMER
 * kayıtları (kullanıcı talebiyle: "cari müşterilerden kendisine arananları
 * listeleyebilir"). Sahiplik kısıtı kod yazmayı gerektirmiyor: `/sales/customers`
 * ucu `sales` rolünde zaten `assignedSalesUserId`'yi kendine sabitliyor (bkz.
 * listManagedCustomersHandler).
 *
 * Kullanıcı talebiyle "Potansiyel Müşteriler" (`SalesLeadCustomersPageClient`)
 * ile AYNI filtreler (arama + sektör + kullanım alanı + il/ilçe) ve AYNI
 * "Adresler & Eşleşen Ürünler" accordion deseni — filtre çubuğu
 * (`SalesCustomerFilterBar`) ve detay paneli parçaları (`ReadOnlyAddressList`,
 * `CustomerProfileMatchedProducts`) PAYLAŞILIYOR.
 */
export function SalesActiveCustomersPageClient() {
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
    } = useCustomerListFilters({ lockedStatus: "CUSTOMER" })

    // `useManagedCustomers` otomatik-yenileme aralığı desteklemiyor (LEAD hook'unun
    // aksine) — refresh bar burada yalnız manuel "Yenile" ve son güncelleme saati
    // için kullanılıyor, `refreshIntervalSeconds` state'i UI'da tutuluyor ama etkisiz.
    const customersQuery = useManagedCustomers(params)
    const customers = customersQuery.data?.data ?? []
    const meta = customersQuery.data?.meta
    const isInitialLoading = customersQuery.isLoading && customers.length === 0
    const isBackgroundRefetch = customersQuery.isFetching && !isInitialLoading

    async function handleRefresh() {
        await customersQuery.refetch()
        toast.success("Liste yenilendi")
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-neutral-950">Cari Müşteriler</h1>
                <p className="text-sm text-neutral-500">
                    Size atanmış, aktif (cari) müşteriler.
                </p>
            </div>

            <SalesCustomerFilterBar
                search={filters.search}
                onSearchChange={setSearch}
                searchPlaceholder="Firma, kişi veya e-posta ara"
                sectorValueId={filters.sectorValueId}
                onSectorValueIdChange={setSectorValueId}
                usageAreaValueId={filters.usageAreaValueId}
                onUsageAreaValueIdChange={setUsageAreaValueId}
                countryId={filters.countryId}
                stateId={filters.stateId}
                cityId={filters.cityId}
                onGeoChange={setGeo}
                hasFilters={hasFilters}
                onReset={reset}
            />

            <AdminListRefreshBar
                dataUpdatedAt={customersQuery.dataUpdatedAt}
                isFetching={customersQuery.isFetching}
                onRefresh={handleRefresh}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <Separator />

            <div className="relative">
                <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} label="Liste güncelleniyor…" />

                <div aria-busy={customersQuery.isFetching} className="space-y-3">
                    {isInitialLoading
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-24 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
                            />
                        ))
                        : customers.map((customer) => (
                            <SalesActiveCustomerCard
                                key={customer.id}
                                customer={customer}
                                isExpanded={expandedId === customer.id}
                                onToggle={() => setExpandedId((prev) => (prev === customer.id ? null : customer.id))}
                            />
                        ))}

                    {!isInitialLoading && customers.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-neutral-950">
                                {hasFilters ? "Filtrelere uyan kayıt yok" : "Size atanmış cari müşteri yok"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                                {hasFilters
                                    ? "Aramayı veya filtreleri temizleyerek tüm kayıtları görebilirsiniz."
                                    : "Bir potansiyel müşteri müşteriye dönüştürüldüğünde burada listelenir."}
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

            {customers.length > 0 ? (
                <AdminListPagination
                    page={meta?.page ?? filters.page}
                    totalPages={meta?.totalPages ?? 1}
                    total={meta?.total ?? 0}
                    limit={filters.limit}
                    itemLabel="cari müşteri"
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            ) : null}
        </div>
    )
}
