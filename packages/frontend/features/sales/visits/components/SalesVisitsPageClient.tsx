"use client"

import { useState } from "react"
import { CalendarClock, MapPin, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { useManagedCustomerVisitsReport } from "@/features/sales/visits/hooks/useManagedCustomerVisitsReport"
import { CreateVisitDialog } from "@/features/sales/visits/components/CreateVisitDialog"
import { CompleteVisitDialog } from "@/features/sales/visits/components/CompleteVisitDialog"
import {
    VISIT_OUTCOME_LABELS,
    VISIT_OUTCOME_STYLES,
    VISIT_STATUS_LABELS,
    VISIT_STATUS_STYLES,
    VISIT_TYPE_LABELS,
} from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { CustomerVisitReportItem, CustomerVisitStatus } from "@/features/admin/customers/api/types"

export function SalesVisitsPageClient() {
    const [statusFilter, setStatusFilter] = useState<CustomerVisitStatus | "">("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [createOpen, setCreateOpen] = useState(false)
    const [completingVisit, setCompletingVisit] = useState<CustomerVisitReportItem | null>(null)

    const visitsQuery = useManagedCustomerVisitsReport({
        page,
        limit,
        status: statusFilter || undefined,
    })

    const visits = visitsQuery.data?.data ?? []
    const meta = visitsQuery.data?.meta

    function handleStatusFilterChange(value: string) {
        setStatusFilter(value === "ALL" ? "" : (value as CustomerVisitStatus))
        setPage(1)
    }

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

            <div className="flex items-center gap-2">
                <Select value={statusFilter || "ALL"} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                        {Object.entries(VISIT_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {visitsQuery.isFetching ? <Spinner className="size-4" /> : null}
            </div>

            <div className="space-y-3">
                {visitsQuery.isLoading ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed">
                        <Spinner className="size-5" />
                    </div>
                ) : visits.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-neutral-500">
                        Henüz ziyaret kaydı bulunmuyor.
                    </div>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-neutral-950">{visit.title}</span>
                                        <Badge className={VISIT_STATUS_STYLES[visit.status]}>
                                            {VISIT_STATUS_LABELS[visit.status]}
                                        </Badge>
                                        {visit.type ? (
                                            <Badge variant="outline">{VISIT_TYPE_LABELS[visit.type]}</Badge>
                                        ) : null}
                                        {visit.outcome ? (
                                            <Badge className={VISIT_OUTCOME_STYLES[visit.outcome]}>
                                                {VISIT_OUTCOME_LABELS[visit.outcome]}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="text-sm font-medium text-neutral-700">
                                        {resolveCustomerDisplayName(visit.customer)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarClock className="h-3.5 w-3.5" />
                                            {new Date(visit.scheduledAt).toLocaleString("tr-TR")}
                                        </span>
                                        {visit.address ? (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {[visit.address.district, visit.address.cityRef?.name ?? visit.address.city]
                                                    .filter(Boolean)
                                                    .join(" / ")}
                                            </span>
                                        ) : null}
                                    </div>
                                    {visit.note ? (
                                        <div className="pt-1 text-sm text-neutral-700">{visit.note}</div>
                                    ) : null}
                                </div>
                                {visit.status === "PLANNED" ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCompletingVisit(visit)}
                                        className="shrink-0"
                                    >
                                        Sonuçlandır
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {meta ? (
                <AdminListPagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    limit={meta.limit}
                    itemLabel="ziyaret"
                    onPageChange={setPage}
                    onLimitChange={(value) => {
                        setLimit(value)
                        setPage(1)
                    }}
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
