"use client"

import { useState } from "react"
import { CalendarClock, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
    describeWeekdays,
    formatShiftRange,
    normalizeShiftDefinitions,
    summarizeShiftPattern,
} from "@core/helpers/production/shiftPatterns"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import type { ShiftPattern } from "@/features/production/shiftPatterns/api/types"
import {
    useDeleteShiftPattern,
    useReplaceShiftPattern,
    useShiftPatterns,
} from "@/features/production/shiftPatterns/hooks/useShiftPatterns"
import { shiftPatternToInput } from "@/features/production/shiftPatterns/schema/shiftPatternForm"
import { ShiftPatternFormDialog } from "./ShiftPatternFormDialog"
import { ShiftPatternTimeline } from "./ShiftPatternTimeline"

function formatHours(minutes: number) {
    return `${Number((minutes / 60).toFixed(2)).toLocaleString("tr-TR")} saat`
}

function ShiftPatternCard({
    pattern,
    isMakingDefault,
    onEdit,
    onMakeDefault,
    onDelete,
}: {
    pattern: ShiftPattern
    isMakingDefault: boolean
    onEdit: () => void
    onMakeDefault: () => void
    onDelete: () => void
}) {
    const shifts = normalizeShiftDefinitions(pattern.shifts)
    const summary = summarizeShiftPattern(shifts)
    const usage = pattern.machineCount + pattern.areaCount
    // Sunucu da aynı iki durumda reddediyor; düğme baştan kapalı ki kullanıcı neden olduğunu görsün.
    const deleteBlockedReason = pattern.isDefault
        ? "Varsayılan düzen silinemez"
        : usage > 0
            ? "Makine veya alanda kullanılıyor"
            : null

    return (
        <article className="h-full space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                        {pattern.name}
                        {pattern.isDefault ? (
                            <Badge variant="secondary" className="rounded-full">Varsayılan</Badge>
                        ) : null}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Günde en fazla {formatHours(summary.maxDailyMinutes)} · {describeWeekdays(summary.workingWeekdays)}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {!pattern.isDefault ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isMakingDefault}
                            onClick={onMakeDefault}
                        >
                            <Star className="h-4 w-4" />
                            Varsayılan yap
                        </Button>
                    ) : null}
                    <Button type="button" variant="ghost" size="icon" aria-label={`${pattern.name} düzenle`} onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDeleteDialog
                        trigger={(
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`${pattern.name} sil`}
                                disabled={Boolean(deleteBlockedReason)}
                                title={deleteBlockedReason ?? undefined}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        title="Vardiya düzeni silinsin mi?"
                        description="Düzen ve vardiyaları kalıcı olarak silinir."
                        itemNames={[pattern.name]}
                        onConfirm={onDelete}
                    />
                </div>
            </header>

            <ShiftPatternTimeline shifts={shifts} />

            <ul className="divide-y text-sm">
                {shifts.map((shift) => (
                    <li key={shift.code} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                        <span className="font-medium">
                            {shift.code} · {shift.name}
                        </span>
                        <span className="text-muted-foreground">
                            {formatShiftRange(shift)} · {describeWeekdays(shift.daysOfWeek)}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="text-xs text-muted-foreground">
                {usage > 0
                    ? `${pattern.machineCount} makine ve ${pattern.areaCount} alan bu düzeni doğrudan kullanıyor.`
                    : "Doğrudan kullanan makine veya alan yok."}
                {pattern.isDefault ? " Düzen seçmemiş makineler de bunu kullanır." : ""}
            </p>
        </article>
    )
}

export function ShiftPatternsPageClient() {
    const patternsQuery = useShiftPatterns()
    const replaceMutation = useReplaceShiftPattern()
    const deleteMutation = useDeleteShiftPattern()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ShiftPattern | null>(null)

    const patterns = patternsQuery.data ?? []
    const isInitialLoading = patternsQuery.isLoading && patterns.length === 0
    const isBackgroundRefetch = patternsQuery.isFetching && !isInitialLoading

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(pattern: ShiftPattern) {
        setEditing(pattern)
        setDialogOpen(true)
    }

    async function makeDefault(pattern: ShiftPattern) {
        try {
            await replaceMutation.mutateAsync({ id: pattern.id, input: shiftPatternToInput(pattern, { isDefault: true }) })
            toast.success(`"${pattern.name}" varsayılan düzen oldu`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    async function remove(pattern: ShiftPattern) {
        try {
            await deleteMutation.mutateAsync(pattern.id)
            toast.success("Vardiya düzeni silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<CalendarClock />}
                title="Vardiya ve Takvim"
                description="Makinelerin günde kaç saat çalıştığını (12 / 16 / 24 saat) vardiyalarla tanımlayın; bayram, toplu izin ve ek mesai günlerini aşağıdaki takvimde girin. Planlama, işleri bu vardiyalara göre yayar ve her vardiyaya bir lot açar."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Düzen
                    </Button>
                )}
            />

            {isInitialLoading ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            ) : patterns.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <CalendarClock />
                        </EmptyMedia>
                        <EmptyTitle>Henüz vardiya düzeni yok</EmptyTitle>
                        <EmptyDescription>
                            Hazır şablonlardan (günde 12 / 16 / 24 saat) biriyle başlayın. İlk düzen kendiliğinden
                            varsayılan olur.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            İlk düzeni oluştur
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="relative" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <ul className="grid gap-4 xl:grid-cols-2">
                        {patterns.map((pattern) => (
                            <li key={pattern.id}>
                                <ShiftPatternCard
                                    pattern={pattern}
                                    isMakingDefault={replaceMutation.isPending}
                                    onEdit={() => openEdit(pattern)}
                                    onMakeDefault={() => void makeDefault(pattern)}
                                    onDelete={() => void remove(pattern)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <ShiftPatternFormDialog open={dialogOpen} onOpenChange={setDialogOpen} pattern={editing} />
        </div>
    )
}
