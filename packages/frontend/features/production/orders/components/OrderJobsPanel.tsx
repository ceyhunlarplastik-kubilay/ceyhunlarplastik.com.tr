"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { formatProductionDateTime, formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { ProductionOrder } from "@/features/production/orders/api/types"
import { useDeleteProductionJob } from "@/features/production/orders/hooks/useProductionOrders"
import { lotDetailPath } from "@/features/production/lots/utils/lotFormat"
import { JOB_STATUS_LABELS } from "@/features/production/shared/jobStatus"


/** Emrin işleri ve vardiya lotları ("1000-1 · 28.09 A · 08:00–20:00 · 16.000 adet"). */
export function OrderJobsPanel({ order }: { order: ProductionOrder }) {
    const deleteMutation = useDeleteProductionJob()

    async function cancel(jobId: string, lotBaseNumber: number) {
        try {
            await deleteMutation.mutateAsync(jobId)
            toast.success(`${lotBaseNumber} numaralı iş iptal edildi`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-3">
            {order.jobs.map((job) => (
                <section key={job.id} className="space-y-2 rounded-xl border bg-background p-3">
                    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-medium">İş {job.lotBaseNumber}</span>
                        <span>{job.machine.code} · {job.mold.code}</span>
                        <span className="text-muted-foreground tabular-nums">
                            {formatProductionDateTime(job.setupStartAt)} → {formatProductionDateTime(job.plannedEndAt)}
                        </span>
                        <span className="tabular-nums">{job.plannedQuantity.toLocaleString("tr-TR")} adet</span>
                        <Badge variant="outline" className="rounded-full">{JOB_STATUS_LABELS[job.status]}</Badge>
                        {job.status === "PLANNED" ? (
                            <ConfirmDeleteDialog
                                trigger={(
                                    <Button type="button" variant="ghost" size="sm" className="ms-auto" aria-label={`İş ${job.lotBaseNumber} iptal et`}>
                                        <Trash2 className="h-4 w-4" />
                                        İşi iptal et
                                    </Button>
                                )}
                                title="Planlı iş iptal edilsin mi?"
                                description="İş, vardiya lotları ve lotlara yazılan notlar silinir; emrin başka işi yoksa emir Taslağa döner ve yeniden planlanabilir."
                                itemNames={[`İş ${job.lotBaseNumber} · ${job.machine.code} · ${job.lots.length} lot`]}
                                confirmLabel="İptal et"
                                onConfirm={() => void cancel(job.id, job.lotBaseNumber)}
                            />
                        ) : null}
                    </header>
                    <ul className="grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {job.lots.map((lot) => (
                            <li key={lot.lotNumber} className="flex flex-wrap items-center gap-x-2 rounded-lg bg-muted/50 px-2 py-1">
                                <Link href={lotDetailPath(lot.lotNumber)} className="font-medium tabular-nums underline-offset-4 hover:underline">{lot.lotNumber}</Link>
                                <span className="text-muted-foreground">{formatDateKey(lot.shiftDate)} · {lot.shiftCode}</span>
                                <span className="tabular-nums">
                                    {formatProductionShortDateTime(lot.plannedStartAt).slice(6)}–{formatProductionShortDateTime(lot.plannedEndAt).slice(6)}
                                </span>
                                <span className="ms-auto tabular-nums">{lot.plannedQuantity.toLocaleString("tr-TR")} adet</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}
