"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useManagedCustomerVisitsReport } from "@/features/sales/visits/hooks/useManagedCustomerVisitsReport"
import { useSalesVisitsFilters } from "@/features/sales/visits/hooks/useSalesVisitsFilters"
import { CreateVisitDialog } from "@/features/sales/visits/components/CreateVisitDialog"
import { CompleteVisitDialog } from "@/features/sales/visits/components/CompleteVisitDialog"
import { CustomerVisitsTable } from "@/features/sales/visits/components/CustomerVisitsTable"
import { SalesVisitsFilterBar } from "@/features/sales/visits/components/SalesVisitsFilterBar"
import type { CustomerVisitReportItem } from "@/features/admin/customers/api/types"

export function SalesVisitsPageClient() {
    const [createOpen, setCreateOpen] = useState(false)
    const [completingVisit, setCompletingVisit] = useState<CustomerVisitReportItem | null>(null)

    const {
        filters,
        params,
        limitOptions,
        setStatus,
        setType,
        setOutcome,
        setScheduledFrom,
        setScheduledTo,
        setGeo,
        setPage,
        setLimit,
        clearAll,
    } = useSalesVisitsFilters()

    const visitsQuery = useManagedCustomerVisitsReport(params)
    const visits = visitsQuery.data?.data ?? []
    const meta = visitsQuery.data?.meta
    const isInitialLoading = visitsQuery.isLoading
    const isBackgroundRefetch = visitsQuery.isFetching && !isInitialLoading

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-950">Ziyaretlerim</h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Planladığınız ve tamamladığınız müşteri ziyaretleri.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-1.5 h-4 w-4" />
                    Yeni Ziyaret
                </Button>
            </div>

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
                    <CustomerVisitsTable visits={visits} onComplete={setCompletingVisit} />
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

            <CreateVisitDialog open={createOpen} onOpenChange={setCreateOpen} />
            <CompleteVisitDialog
                visit={completingVisit}
                onOpenChange={(open) => {
                    if (!open) setCompletingVisit(null)
                }}
            />
        </div>
    )
}
