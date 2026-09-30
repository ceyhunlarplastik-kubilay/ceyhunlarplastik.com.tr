"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateKey, formatDateKeyRange } from "@core/helpers/production/productionCalendar"
import {
    formatProductionDateTime,
    formatProductionShortDateTime,
    formatWorkMinutes,
} from "@core/helpers/production/productionTime"
import { isForecastAlert } from "@core/helpers/production/jobForecast"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { BoardJob, BoardMachine, PlacementMode } from "@/features/production/board/api/types"
import { useDeleteProductionJob } from "@/features/production/orders/hooks/useProductionOrders"
import type { BoardMoveFormValues } from "@/features/production/board/schema/boardMoveForm"
import { isJobMovable } from "@/features/production/board/utils/boardGeometry"
import { lotDetailPath } from "@/features/production/lots/utils/lotFormat"
import { jobCalendarDays, jobWorkMinutes } from "@/features/production/shared/jobDurations"
import { JOB_STATUS_LABELS } from "@/features/production/shared/jobStatus"
import { BoardJobForecastSection } from "./BoardJobForecastSection"
import { BoardJobMoveForm } from "./BoardJobMoveForm"

type Props = {
    job: BoardJob | null
    machine: BoardMachine | null
    /** Taşı formunun hedef listesi (tahtadaki makineler). */
    machines: BoardMachine[]
    /** Tahtadaki işler — "sonraki işleri kaydır" onayında listelenir. */
    boardJobs: BoardJob[]
    isMoving: boolean
    isPushing: boolean
    onPushFollowers: (job: BoardJob) => void
    placementMode: PlacementMode
    onMove: (job: BoardJob, values: BoardMoveFormValues) => void
    onOpenChange: (open: boolean) => void
}

/**
 * Tahtada seçilen işin ayrıntısı: zamanlar, gerçekleşen ve tahmin (başlamış, geciken ya da kalıp
 * bakımı izlenen işte), emir(ler), vardiya lotları; planlı iş taşınır / iptal edilebilir.
 */
export function BoardJobDialog({
    job,
    machine,
    machines,
    boardJobs,
    isMoving,
    isPushing,
    onPushFollowers,
    placementMode,
    onMove,
    onOpenChange,
}: Props) {
    const deleteMutation = useDeleteProductionJob()

    async function cancel(target: BoardJob) {
        try {
            await deleteMutation.mutateAsync(target.id)
            toast.success(`${target.lotBaseNumber} numaralı iş iptal edildi`)
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    // Çalışma süresi (motorun formülü) ve takvimde kapladığı günler — eski "Toplam süre" geceleri de sayan
    // takvim aralığını "2 gün 10 sa" diye yazıyor, iş kısa sürüyormuş gibi okunuyordu.
    const work = job ? jobWorkMinutes(job) : null
    const calendar = job ? jobCalendarDays(job.setupStartAt, job.plannedEndAt) : null

    return (
        <Dialog open={Boolean(job)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(48rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl">
                {job && work && calendar ? (
                    <>
                        <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6">
                            <DialogTitle className="flex flex-wrap items-center gap-2">
                                İş {job.lotBaseNumber}
                                <Badge variant="outline" className="rounded-full">{JOB_STATUS_LABELS[job.status]}</Badge>
                            </DialogTitle>
                            <DialogDescription>
                                {machine ? `${machine.code} · ${machine.name}` : "Makine"} — kalıp {job.mold.code} · {job.mold.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
                            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                                <Detail label="Bağlama başı" value={formatProductionDateTime(job.setupStartAt)} />
                                <Detail label="Üretim başı" value={formatProductionDateTime(job.productionStartAt)} />
                                <Detail label="Planlı bitiş" value={formatProductionDateTime(job.plannedEndAt)} />
                                <Detail
                                    label="Çalışma süresi"
                                    value={(
                                        <span>
                                            {formatWorkMinutes(work.totalMinutes)}
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                bağlama {formatWorkMinutes(work.setupMinutes)} + üretim {formatWorkMinutes(work.productionMinutes)} · verim %{job.efficiencyPercent}
                                            </span>
                                        </span>
                                    )}
                                />
                                <Detail
                                    label="Takvimde"
                                    value={`${calendar.days} gün · ${formatDateKeyRange(calendar.from, calendar.to)}`}
                                />
                                <Detail label="Baskı" value={`${job.plannedShots.toLocaleString("tr-TR")} baskı · ${job.cycleTimeSec.toLocaleString("tr-TR")} sn çevrim`} />
                                {job.colorName ? (
                                    <Detail
                                        label="Renk"
                                        value={(
                                            <span className="inline-flex items-center gap-1.5">
                                                {job.colorHex ? <span className="h-3 w-3 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: job.colorHex }} /> : null}
                                                {job.colorName}
                                            </span>
                                        )}
                                    />
                                ) : null}
                            </dl>

                            {job.status !== "PLANNED" || isForecastAlert(job.forecast) || job.moldMaintenance.level !== "NONE" ? (
                                <BoardJobForecastSection
                                    job={job}
                                    machineCode={machine?.code ?? ""}
                                    boardJobs={boardJobs}
                                    isPushing={isPushing}
                                    onPushFollowers={onPushFollowers}
                                />
                            ) : null}

                            {isJobMovable(job) ? (
                                <BoardJobMoveForm
                                    // İş ya da sürümü değişince form yeni değerlerle kurulur.
                                    key={`${job.id}:${job.version}`}
                                    job={job}
                                    machines={machines}
                                    isPending={isMoving}
                                    placementMode={placementMode}
                                    onSubmit={(values) => onMove(job, values)}
                                />
                            ) : null}

                            <section className="space-y-2">
                                <h3 className="text-sm font-semibold">Emirler</h3>
                                <ul className="space-y-1.5 text-sm">
                                    {job.outputs.map((output) => (
                                        <li key={output.productSizeId} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2">
                                            {output.order ? (
                                                <>
                                                    <Link
                                                        href={`/uretim/emirler?q=${encodeURIComponent(output.order.orderNumber)}&durum=all`}
                                                        className="font-medium underline-offset-4 hover:underline"
                                                    >
                                                        {output.order.orderNumber}
                                                    </Link>
                                                    <span className="font-mono text-xs">{output.order.variantCode}</span>
                                                    {output.order.dueDate ? (
                                                        <span className="text-muted-foreground">Termin {formatDateKey(output.order.dueDate)}</span>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">Emre bağlı olmayan göz</span>
                                            )}
                                            <span className="ms-auto tabular-nums">
                                                {output.cavities} göz · {output.plannedQuantity.toLocaleString("tr-TR")} adet
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-sm font-semibold">Vardiya lotları</h3>
                                <ul className="grid gap-1 text-xs sm:grid-cols-2">
                                    {job.lots.map((lot) => (
                                        <li key={lot.lotNumber} className="flex flex-wrap items-center gap-x-2 rounded-lg bg-muted/50 px-2 py-1">
                                            <Link href={lotDetailPath(lot.lotNumber)} className="font-medium tabular-nums underline-offset-4 hover:underline">{lot.lotNumber}</Link>
                                            <span className="text-muted-foreground">{formatDateKey(lot.shiftDate)} · {lot.shiftCode}</span>
                                            <span className="tabular-nums">
                                                {formatProductionShortDateTime(lot.plannedStartAt).slice(6)}–{formatProductionShortDateTime(lot.plannedEndAt).slice(6)}
                                            </span>
                                            <span className="ms-auto tabular-nums">
                                                {lot.reported && lot.actualShots !== null ? (
                                                    <span className="font-medium text-emerald-700 dark:text-emerald-400" title="Vardiya raporundaki baskı / planlanan">
                                                        {lot.actualShots.toLocaleString("tr-TR")} /{" "}
                                                    </span>
                                                ) : lot.status === "RUNNING" ? (
                                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">üretimde · </span>
                                                ) : null}
                                                {lot.plannedShots.toLocaleString("tr-TR")} baskı
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {job.status === "PLANNED" ? (
                            <div className="flex shrink-0 justify-end border-t px-5 py-3 sm:px-6">
                                <ConfirmDeleteDialog
                                    trigger={(
                                        <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
                                            <Trash2 className="h-4 w-4" />
                                            İşi iptal et
                                        </Button>
                                    )}
                                    title="Planlı iş iptal edilsin mi?"
                                    description="İş, vardiya lotları ve lotlara yazılan notlar silinir; emrin başka işi yoksa emir Taslağa döner ve yeniden planlanabilir."
                                    itemNames={[`İş ${job.lotBaseNumber} · ${machine?.code ?? ""} · ${job.lots.length} lot`]}
                                    confirmLabel="İptal et"
                                    onConfirm={() => void cancel(job)}
                                />
                            </div>
                        ) : null}
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

/** Telefonda etiket solda tek satır, değer sağa yaslı — iki satırlı değer ("Çalışma süresi") de öyle. */
function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex justify-between gap-3 sm:block">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="text-end font-medium tabular-nums sm:text-start">{value}</dd>
        </div>
    )
}
