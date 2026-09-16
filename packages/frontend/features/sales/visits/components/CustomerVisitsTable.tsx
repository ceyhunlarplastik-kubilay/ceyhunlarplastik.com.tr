"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    VISIT_OUTCOME_LABELS,
    VISIT_OUTCOME_STYLES,
    VISIT_STATUS_LABELS,
    VISIT_STATUS_STYLES,
    VISIT_TYPE_LABELS,
} from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import { getUserDisplayName } from "@/lib/users/displayName"
import type { CustomerVisitReportItem } from "@/features/admin/customers/api/types"

function VisitLocationCell({ visit }: { visit: CustomerVisitReportItem }) {
    if (!visit.address) return <span className="text-neutral-400">—</span>

    const cityLabel = visit.address.cityRef?.name ?? visit.address.city
    const label = [visit.address.district, cityLabel].filter(Boolean).join(" / ")
    return <span className="text-neutral-600">{label || "—"}</span>
}

type Props = {
    visits: CustomerVisitReportItem[]
    /** Çapraz-temsilci rapor sayfası "Temsilci" kolonunu gösterir; "Ziyaretlerim" (yalnız kendi ziyaretleri) göstermez. */
    showOwnerColumn?: boolean
    /** "Ziyaretlerim" bu düğmeyle bir ziyareti sonuçlandırır; salt-okunur rapor görünümünde yok. */
    onComplete?: (visit: CustomerVisitReportItem) => void
}

/**
 * Ziyaret tablosu — hem `/satis/ziyaretlerim` (Dilim 2) hem çapraz-temsilci
 * rapor sayfası (Dilim 3, admin + satış müdürü) tarafından paylaşılır.
 */
export function CustomerVisitsTable({ visits, showOwnerColumn = false, onComplete }: Props) {
    return (
        // `Table` kendi container'ını zaten `overflow-x-auto` ile sarıyor
        // (bkz. components/ui/table.tsx) — ikinci bir sarmalayıcıya gerek yok.
        <Table className={showOwnerColumn ? "min-w-200" : "min-w-175"}>
            <TableHeader>
                <TableRow>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    {showOwnerColumn ? <TableHead>Temsilci</TableHead> : null}
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Sonuç</TableHead>
                    <TableHead>Not</TableHead>
                    {onComplete ? (
                        <TableHead className="text-end">
                            <span className="sr-only">Aksiyon</span>
                        </TableHead>
                    ) : null}
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
                        {showOwnerColumn ? (
                            <TableCell className="whitespace-nowrap text-neutral-600">
                                {visit.ownerUser ? (getUserDisplayName(visit.ownerUser) || visit.ownerUser.email) : "—"}
                            </TableCell>
                        ) : null}
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
                        {onComplete ? (
                            <TableCell className="text-end">
                                {visit.status === "PLANNED" ? (
                                    <Button variant="outline" size="sm" onClick={() => onComplete(visit)}>
                                        Sonuçlandır
                                    </Button>
                                ) : null}
                            </TableCell>
                        ) : null}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
