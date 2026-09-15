"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useManagedCustomerVisitsReport } from "@/features/sales/visits/hooks/useManagedCustomerVisitsReport"
import { useSalesVisitsFilters } from "@/features/sales/visits/hooks/useSalesVisitsFilters"
import { CreateVisitDialog } from "@/features/sales/visits/components/CreateVisitDialog"
import { CompleteVisitDialog } from "@/features/sales/visits/components/CompleteVisitDialog"
import { SalesVisitsFilterBar } from "@/features/sales/visits/components/SalesVisitsFilterBar"
import {
    VISIT_OUTCOME_LABELS,
    VISIT_OUTCOME_STYLES,
    VISIT_STATUS_LABELS,
    VISIT_STATUS_STYLES,
    VISIT_TYPE_LABELS,
} from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { CustomerVisitReportItem } from "@/features/admin/customers/api/types"

function VisitLocationCell({ visit }: { visit: CustomerVisitReportItem }) {
    if (!visit.address) return <span className="text-neutral-400">—</span>

    const cityLabel = visit.address.cityRef?.name ?? visit.address.city
    const label = [visit.address.district, cityLabel].filter(Boolean).join(" / ")
    return <span className="text-neutral-600">{label || "—"}</span>
}

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
                    // `Table` kendi container'ını zaten `overflow-x-auto` ile sarıyor
                    // (bkz. components/ui/table.tsx) — ikinci bir sarmalayıcıya gerek yok.
                    <Table className="min-w-175">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Konum</TableHead>
                                <TableHead>Sonuç</TableHead>
                                <TableHead>Not</TableHead>
                                <TableHead className="text-end">
                                    <span className="sr-only">Aksiyon</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visits.map((visit) => (
                                <TableRow key={visit.id}>
                                    <TableCell>
                                        <Badge className={VISIT_STATUS_STYLES[visit.status]}>
                                            {VISIT_STATUS_LABELS[visit.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-neutral-700">
                                        {new Date(visit.scheduledAt).toLocaleString("tr-TR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                    <TableCell className="max-w-50">
                                        <div className="truncate font-medium text-neutral-900" title={resolveCustomerDisplayName(visit.customer)}>
                                            {resolveCustomerDisplayName(visit.customer)}
                                        </div>
                                        <div className="truncate text-xs text-neutral-500" title={visit.title}>
                                            {visit.title}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-neutral-600">
                                        {visit.type ? VISIT_TYPE_LABELS[visit.type] : "—"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <VisitLocationCell visit={visit} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {visit.outcome ? (
                                            <Badge className={VISIT_OUTCOME_STYLES[visit.outcome]}>
                                                {VISIT_OUTCOME_LABELS[visit.outcome]}
                                            </Badge>
                                        ) : (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-60">
                                        {visit.note ? (
                                            <div className="truncate text-neutral-600" title={visit.note}>
                                                {visit.note}
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {visit.status === "PLANNED" ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompletingVisit(visit)}
                                            >
                                                Sonuçlandır
                                            </Button>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
