"use client"

import { useMemo } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useCustomerVisitsReport } from "@/features/admin/customers/hooks/useCustomerVisitsReport"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { getUserDisplayName } from "@/lib/users/displayName"
import { CustomerVisitsReportCharts } from "@/features/admin/customers/components/CustomerVisitsReportCharts"
import { CustomerVisitsTable } from "@/features/sales/visits/components/CustomerVisitsTable"
import { SalesVisitsFilterBar } from "@/features/sales/visits/components/SalesVisitsFilterBar"
import { useSalesVisitsFilters } from "@/features/sales/visits/hooks/useSalesVisitsFilters"
import type { CustomerVisitReportItem, CustomerVisitsReportSummary } from "@/features/admin/customers/api/types"

type OwnerOption = { id: string; label: string }

type ReportViewProps = {
    title: string
    description: string
    filtersState: ReturnType<typeof useSalesVisitsFilters>
    visits: CustomerVisitReportItem[]
    meta?: { page: number; limit: number; total: number; totalPages: number }
    isInitialLoading: boolean
    isBackgroundRefetch: boolean
    /** `undefined` → temsilci filtresi hiç gösterilmez (yetkisiz görüntüleyici). */
    ownerOptions?: OwnerOption[]
    /** Yalnız admin ucu doldurur — dolduğunda grafikler gösterilir. */
    summary?: CustomerVisitsReportSummary
    /** Kullanıcı talebiyle: "Potansiyel Müşteriler"/"Cari Müşteriler" filtresi. */
    showCustomerStatusFilter?: boolean
}

/**
 * Çapraz-temsilci ziyaret raporu — sunum katmanı. `SalesVisitsFilterBar`/
 * `CustomerVisitsTable` ("Ziyaretlerim"den, Dilim 2) aynen reuse edilir;
 * buradaki fark yalnız `showOwnerColumn`/temsilci filtresi ve salt-okunur
 * olması (tamamlama aksiyonu yok — o "Ziyaretlerim"in işi).
 *
 * Şu an yalnız `/admin/musteri-ziyaretleri` kullanıyor — kullanıcı talebiyle
 * satış panelinden (sıradan temsilciyle paylaşılan `/musteri-temsilcisi`) kaldırıldı;
 * satış müdürüne özel ayrı bir alan açıldığında oraya taşınabilir
 * (bkz. IMPROVEMENT_PLAN.md).
 */
function CustomerVisitsReportView({
    title,
    description,
    filtersState,
    visits,
    meta,
    isInitialLoading,
    isBackgroundRefetch,
    ownerOptions,
    summary,
    showCustomerStatusFilter,
}: ReportViewProps) {
    const {
        filters,
        limitOptions,
        setOwnerUserId,
        setCustomerStatus,
        setStatus,
        setType,
        setOutcome,
        setScheduledFrom,
        setScheduledTo,
        setGeo,
        setPage,
        setLimit,
        clearAll,
    } = filtersState

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold text-neutral-950">{title}</h1>
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
            </div>

            {summary ? <CustomerVisitsReportCharts summary={summary} /> : null}

            <SalesVisitsFilterBar
                status={filters.status}
                type={filters.type}
                outcome={filters.outcome}
                scheduledFrom={filters.scheduledFrom}
                scheduledTo={filters.scheduledTo}
                countryId={filters.countryId}
                stateId={filters.stateId}
                cityId={filters.cityId}
                hasActiveFilters={filters.hasActiveFilters}
                onStatusChange={setStatus}
                onTypeChange={setType}
                onOutcomeChange={setOutcome}
                onScheduledFromChange={setScheduledFrom}
                onScheduledToChange={setScheduledTo}
                onGeoChange={setGeo}
                onClear={clearAll}
                ownerUserId={filters.ownerUserId}
                ownerOptions={ownerOptions}
                onOwnerUserIdChange={ownerOptions ? setOwnerUserId : undefined}
                customerStatus={filters.customerStatus}
                onCustomerStatusChange={showCustomerStatusFilter ? setCustomerStatus : undefined}
            />

            <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} label="Ziyaretler güncelleniyor…" />

                {isInitialLoading ? (
                    <div className="space-y-2 p-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="h-14 w-full rounded-xl" />
                        ))}
                    </div>
                ) : visits.length === 0 ? (
                    <div className="p-8 text-center text-sm text-neutral-500">
                        {filters.hasActiveFilters
                            ? "Bu filtrelerle eşleşen ziyaret bulunamadı."
                            : "Henüz ziyaret kaydı bulunmuyor."}
                    </div>
                ) : (
                    <CustomerVisitsTable visits={visits} showOwnerColumn />
                )}
            </div>

            {meta ? (
                <AdminListPagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    limit={meta.limit}
                    limitOptions={limitOptions}
                    itemLabel="ziyaret"
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            ) : null}
        </div>
    )
}

function toOwnerOptions(users: Array<{ id: string; groups: string[]; email: string; firstName?: string | null; lastName?: string | null; identifier?: string | null }>) {
    return users
        .filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director"))
        .map((user) => ({ id: user.id, label: getUserDisplayName(user) || user.email }))
        .sort((left, right) => left.label.localeCompare(right.label, "tr"))
}

/** `/admin/musteri-ziyaretleri` — admin/owner, tüm temsilciler serbestçe filtrelenebilir. */
export function AdminCustomerVisitsReportPageClient() {
    const filtersState = useSalesVisitsFilters()
    const visitsQuery = useCustomerVisitsReport(filtersState.params)
    const usersQuery = useUsers({ params: { page: 1, limit: 500 } })

    const ownerOptions = useMemo(() => toOwnerOptions(usersQuery.data?.data ?? []), [usersQuery.data?.data])

    return (
        <CustomerVisitsReportView
            title="Müşteri Ziyaretleri"
            description="Tüm temsilcilerin planladığı ve tamamladığı ziyaretler — temsilci, müşteri durumu, tarih aralığı ve il/ilçeye göre filtreleyin."
            filtersState={filtersState}
            visits={visitsQuery.data?.data ?? []}
            meta={visitsQuery.data?.meta}
            isInitialLoading={visitsQuery.isLoading}
            isBackgroundRefetch={visitsQuery.isFetching && !visitsQuery.isLoading}
            ownerOptions={ownerOptions}
            summary={visitsQuery.data?.summary}
            showCustomerStatusFilter
        />
    )
}
