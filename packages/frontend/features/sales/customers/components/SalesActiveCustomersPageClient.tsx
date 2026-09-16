"use client"

import { Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useCustomerListFilters } from "@/features/admin/customers/hooks/useCustomerListFilters"
import { useManagedCustomers } from "@/features/sales/customers/hooks/useManagedCustomers"
import { SalesActiveCustomerCard } from "@/features/sales/customers/components/SalesActiveCustomerCard"

/**
 * "Cari Müşteriler" — satış temsilcisinin KENDİSİNE atanmış, status=CUSTOMER
 * kayıtları (kullanıcı talebiyle: "cari müşterilerden kendisine arananları
 * listeleyebilir"). `useCustomerListFilters({ lockedStatus: "CUSTOMER" })`
 * zaten genel bir hook — burada yalnız arama/sayfalama kullanılır, sektör/
 * kullanım alanı/geo filtreleri bu dilimde istenmedi. Sahiplik kısıtı ayrıca
 * kod yazmayı gerektirmiyor: `/sales/customers` ucu `sales` rolünde zaten
 * `assignedSalesUserId`'yi kendine sabitliyor (bkz. listManagedCustomersHandler).
 */
export function SalesActiveCustomersPageClient() {
    const { filters, params, setSearch, setPage, setLimit } = useCustomerListFilters({
        lockedStatus: "CUSTOMER",
    })

    const customersQuery = useManagedCustomers(params)
    const customers = customersQuery.data?.data ?? []
    const meta = customersQuery.data?.meta
    const isInitialLoading = customersQuery.isLoading && customers.length === 0
    const isBackgroundRefetch = customersQuery.isFetching && !isInitialLoading

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-neutral-950">Cari Müşteriler</h1>
                <p className="text-sm text-neutral-500">
                    Size atanmış, aktif (cari) müşteriler.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                    value={filters.search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Firma, kişi veya e-posta ara"
                    className="h-11 rounded-2xl pl-9"
                />
            </div>

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
                            <SalesActiveCustomerCard key={customer.id} customer={customer} />
                        ))}

                    {!isInitialLoading && customers.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-neutral-950">
                                {filters.search ? "Aramaya uyan kayıt yok" : "Size atanmış cari müşteri yok"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                                {filters.search ? (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto p-0"
                                        onClick={() => setSearch("")}
                                    >
                                        Aramayı temizle
                                    </Button>
                                ) : (
                                    "Bir potansiyel müşteri müşteriye dönüştürüldüğünde burada listelenir."
                                )}
                            </p>
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
