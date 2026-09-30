"use client"

import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { downtimeDurationMinutes, downtimeTimeStatus, type DowntimeTimeStatus } from "@core/helpers/production/machineDowntimes"
import {
    formatDurationMinutes,
    formatProductionTimeRange,
    productionDateKey,
} from "@core/helpers/production/productionTime"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { MachineDowntime } from "@/features/production/downtimes/api/types"
import {
    useDeleteMachineDowntime,
    useRecentMachineDowntimes,
} from "@/features/production/downtimes/hooks/useMachineDowntimes"
import {
    describeDowntimeAuthor,
    RECENT_DOWNTIME_DAYS,
    sortDowntimesForList,
} from "@/features/production/downtimes/lib/downtimeList"
import { useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import { DOWNTIME_KIND_BADGE_CLASSES, DOWNTIME_KIND_LABELS } from "@/features/production/shared/downtimeKinds"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { cn } from "@/lib/utils"
import { MachineDowntimeFormDialog } from "./MachineDowntimeFormDialog"

const TIME_STATUS_LABELS: Record<DowntimeTimeStatus, string> = {
    active: "Sürüyor",
    upcoming: "Planlandı",
    past: "Bitti",
}

const TIME_STATUS_CLASSES: Record<DowntimeTimeStatus, string> = {
    active: "font-medium text-red-700 dark:text-red-400",
    upcoming: "text-foreground",
    past: "text-muted-foreground",
}

/**
 * Makine sayfasındaki duruş bölümü: planlı bakım ve arıza pencereleri. Liste, makine
 * tablosundaki "duruşta / yaklaşan duruş" uyarısıyla aynı sorguyu paylaşır.
 */
export function MachineDowntimesSection() {
    const now = useNow()
    const today = productionDateKey(now)
    const downtimesQuery = useRecentMachineDowntimes()
    const machinesQuery = useProductionMachines()
    const deleteMutation = useDeleteMachineDowntime()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<MachineDowntime | null>(null)

    const downtimes = useMemo(() => downtimesQuery.data ?? [], [downtimesQuery.data])
    const sortedDowntimes = useMemo(() => sortDowntimesForList(downtimes, now), [downtimes, now])
    // Sabit referans: bölüm dakikada bir yeniden çizilir; yeni dizi dialog formunu sıfırlardı.
    const machines = useMemo(() => machinesQuery.data ?? [], [machinesQuery.data])

    const isInitialLoading = downtimesQuery.isLoading && downtimes.length === 0
    const isBackgroundRefetch = downtimesQuery.isFetching && !isInitialLoading

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(downtime: MachineDowntime) {
        setEditing(downtime)
        setDialogOpen(true)
    }

    async function remove(downtime: MachineDowntime) {
        try {
            await deleteMutation.mutateAsync(downtime.id)
            toast.success("Duruş silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <section id="duruslar" className="scroll-mt-24 space-y-4" aria-labelledby="duruslar-baslik">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h2 id="duruslar-baslik" className="flex items-center gap-2 text-lg font-semibold [&_svg]:size-5">
                        <Wrench />
                        Duruşlar
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        Planlı bakım ve arıza pencereleri; planlama bu aralıklarda makineye iş koymaz. Saatler fabrika
                        saatiyle; son {RECENT_DOWNTIME_DAYS} gün ve sonrası listelenir.
                    </p>
                </div>
                <Button type="button" className="shrink-0 rounded-2xl" onClick={openCreate} disabled={machines.length === 0}>
                    <Plus className="h-4 w-4" />
                    Yeni Duruş
                </Button>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-40 rounded-2xl" />
            ) : sortedDowntimes.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Wrench />
                        </EmptyMedia>
                        <EmptyTitle>Kayıtlı duruş yok</EmptyTitle>
                        <EmptyDescription>
                            Planlı bakımı önceden girin; planlama o aralığa iş koymaz. Arızayı da girerseniz ileride makine
                            kullanım istatistiğinde görünür.
                        </EmptyDescription>
                    </EmptyHeader>
                    {machines.length > 0 ? (
                        <EmptyContent>
                            <Button type="button" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                İlk duruşu ekle
                            </Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Makine</TableHead>
                                <TableHead>Zaman</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-24 text-end">
                                    <span className="sr-only">İşlemler</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedDowntimes.map((downtime) => {
                                const status = downtimeTimeStatus(downtime, now)
                                const range = formatProductionTimeRange(downtime.startAt, downtime.endAt)
                                const author = describeDowntimeAuthor(downtime.createdByUser)

                                return (
                                    <TableRow key={downtime.id} className={cn(status === "past" && "text-muted-foreground")}>
                                        <TableCell>
                                            <div className="font-medium">{downtime.machine.code}</div>
                                            <div className="text-xs text-muted-foreground">{downtime.machine.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="tabular-nums">{range}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDurationMinutes(downtimeDurationMinutes(downtime))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("rounded-full", DOWNTIME_KIND_BADGE_CLASSES[downtime.kind])}>
                                                {DOWNTIME_KIND_LABELS[downtime.kind]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-72">
                                            <div className="truncate" title={downtime.reason ?? undefined}>{downtime.reason ?? "—"}</div>
                                            {author ? <div className="text-xs text-muted-foreground">Giren: {author}</div> : null}
                                        </TableCell>
                                        <TableCell className={TIME_STATUS_CLASSES[status]}>{TIME_STATUS_LABELS[status]}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`${downtime.machine.code} duruşunu düzenle`}
                                                    onClick={() => openEdit(downtime)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <ConfirmDeleteDialog
                                                    trigger={(
                                                        <Button type="button" variant="ghost" size="icon" aria-label={`${downtime.machine.code} duruşunu sil`}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    title="Duruş silinsin mi?"
                                                    description="Kayıt kalıcı olarak silinir; makine o aralıkta yeniden planlamaya açık olur."
                                                    itemNames={[`${downtime.machine.code} · ${range}`]}
                                                    onConfirm={() => void remove(downtime)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            <MachineDowntimeFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                downtime={editing}
                machines={machines}
                downtimes={downtimes}
                today={today}
            />
        </section>
    )
}
