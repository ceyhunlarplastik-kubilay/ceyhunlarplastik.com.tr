"use client"

import { useMemo, useState } from "react"
import { parseAsInteger, useQueryStates } from "nuqs"
import { CalendarX2, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    formatDateKeyRange,
    groupCalendarExceptionDays,
    weekdayOfDateKey,
    type CalendarExceptionGroup,
} from "@core/helpers/production/productionCalendar"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { useProductionAreas } from "@/features/production/areas/hooks/useProductionAreas"
import type { CalendarException } from "@/features/production/calendar/api/types"
import {
    useCalendarExceptions,
    useDeleteCalendarExceptions,
} from "@/features/production/calendar/hooks/useCalendarExceptions"
import { useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import {
    CALENDAR_EXCEPTION_KIND_BADGE_CLASSES,
    CALENDAR_EXCEPTION_KIND_LABELS,
} from "@/features/production/shared/calendarExceptionKinds"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { cn } from "@/lib/utils"
import { CalendarExceptionFormDialog } from "./CalendarExceptionFormDialog"

type Group = CalendarExceptionGroup<CalendarException>

function describeScope(group: Group) {
    const { area, machine } = group.days[0]
    if (machine) return { label: "Makine", value: `${machine.code} · ${machine.name}` }
    if (area) return { label: "Alan", value: `${area.code} · ${area.name}` }
    return { label: null, value: "Tüm fabrika" }
}

function describeWeekdaySpan(group: Group) {
    const first = weekdayShortLabel(weekdayOfDateKey(group.startDate))
    if (group.dayCount === 1) return first
    return `${group.dayCount} gün · ${first} – ${weekdayShortLabel(weekdayOfDateKey(group.endDate))}`
}

/**
 * Vardiya sayfasındaki takvim istisnaları bölümü: bayram / toplu izin / ek mesai.
 * Kayıtlar gün başına saklanır; burada ardışık günler tek satırda birleştirilir.
 */
export function CalendarExceptionsSection() {
    const now = useNow()
    const today = productionDateKey(now)
    const currentYear = Number(today.slice(0, 4))
    // Yıl URL'de (`?yil=2027`): ekran paylaşılabilir, geri tuşu korunur.
    const [{ yil: year }, setParams] = useQueryStates({ yil: parseAsInteger.withDefault(currentYear) })

    const exceptionsQuery = useCalendarExceptions(year)
    const areasQuery = useProductionAreas()
    const machinesQuery = useProductionMachines()
    const deleteMutation = useDeleteCalendarExceptions()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Group | null>(null)

    const groups = useMemo(() => groupCalendarExceptionDays(exceptionsQuery.data ?? []), [exceptionsQuery.data])
    const isInitialLoading = exceptionsQuery.isLoading && !exceptionsQuery.data
    const isBackgroundRefetch = exceptionsQuery.isFetching && !isInitialLoading

    function changeYear(next: number) {
        void setParams({ yil: next === currentYear ? null : next })
    }

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(group: Group) {
        setEditing(group)
        setDialogOpen(true)
    }

    async function remove(group: Group) {
        try {
            await deleteMutation.mutateAsync(group.ids)
            toast.success("Takvim kaydı silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <section id="takvim" className="scroll-mt-24 space-y-4" aria-labelledby="takvim-baslik">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h2 id="takvim-baslik" className="flex items-center gap-2 text-lg font-semibold [&_svg]:size-5">
                        <CalendarX2 />
                        Takvim İstisnaları
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        Vardiya düzeninin dışındaki günler: bayram, toplu izin ve ek mesai. Tüm fabrikaya, bir alana ya da tek
                        makineye tanımlanır; aynı gün için en dar kapsam geçerlidir (makine &gt; alan &gt; fabrika).
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1 rounded-2xl border p-1">
                        <Button type="button" variant="ghost" size="icon" aria-label="Önceki yıl" onClick={() => changeYear(year - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-12 text-center text-sm font-medium tabular-nums" aria-live="polite">
                            {year}
                        </span>
                        <Button type="button" variant="ghost" size="icon" aria-label="Sonraki yıl" onClick={() => changeYear(year + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Kayıt
                    </Button>
                </div>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-40 rounded-2xl" />
            ) : groups.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <CalendarX2 />
                        </EmptyMedia>
                        <EmptyTitle>{year} için takvim kaydı yok</EmptyTitle>
                        <EmptyDescription>
                            Hafta sonları vardiya düzeninde tanımlı; burada yalnız istisnalar girilir (ör. Kurban Bayramı, yıllık
                            bakım için toplu izin, Pazar ek mesaisi).
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            İlk kaydı ekle
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Kapsam</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead className="w-24 text-end">
                                    <span className="sr-only">İşlemler</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map((group) => {
                                const range = formatDateKeyRange(group.startDate, group.endDate)
                                const scope = describeScope(group)
                                const isPast = group.endDate < today

                                return (
                                    <TableRow key={group.key} className={cn(isPast && "text-muted-foreground")}>
                                        <TableCell>
                                            <div className="font-medium tabular-nums">{range}</div>
                                            <div className="text-xs text-muted-foreground">{describeWeekdaySpan(group)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("rounded-full", CALENDAR_EXCEPTION_KIND_BADGE_CLASSES[group.kind])}>
                                                {CALENDAR_EXCEPTION_KIND_LABELS[group.kind]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {scope.label ? <div className="text-xs text-muted-foreground">{scope.label}</div> : null}
                                            <div>{scope.value}</div>
                                        </TableCell>
                                        <TableCell className="max-w-64 truncate" title={group.note ?? undefined}>
                                            {group.note ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`${range} kaydını düzenle`}
                                                    onClick={() => openEdit(group)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <ConfirmDeleteDialog
                                                    trigger={(
                                                        <Button type="button" variant="ghost" size="icon" aria-label={`${range} kaydını sil`}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    title="Takvim kaydı silinsin mi?"
                                                    description="Aralıktaki tüm günler silinir; o günler yeniden vardiya düzenine göre çalışma günü sayılır."
                                                    itemNames={[group.note ? `${range} · ${group.note}` : range]}
                                                    onConfirm={() => void remove(group)}
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

            <CalendarExceptionFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                group={editing}
                areas={areasQuery.data ?? []}
                machines={machinesQuery.data ?? []}
                today={today}
            />
        </section>
    )
}
