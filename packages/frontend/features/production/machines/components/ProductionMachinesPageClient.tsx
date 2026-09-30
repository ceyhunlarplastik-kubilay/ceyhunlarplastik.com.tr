"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { parseAsString, useQueryStates } from "nuqs"
import { Factory, Pencil, Plus, Search, Trash2, Warehouse } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { describeMachineDowntimeState } from "@core/helpers/production/machineDowntimes"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import { resolveEffectiveShiftPattern } from "@core/helpers/production/shiftPatterns"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { useProductionAreas } from "@/features/production/areas/hooks/useProductionAreas"
import type { MachineDowntime } from "@/features/production/downtimes/api/types"
import { useRecentMachineDowntimes } from "@/features/production/downtimes/hooks/useMachineDowntimes"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import { useDeleteProductionMachine, useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import { filterProductionMachines } from "@/features/production/machines/lib/filterProductionMachines"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import {
    MACHINE_STATUS_BADGE_CLASSES,
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_OPTIONS,
} from "@/features/production/shared/machineStatus"
import { useShiftPatterns } from "@/features/production/shiftPatterns/hooks/useShiftPatterns"
import { cn } from "@/lib/utils"
import { ProductionMachineFormDialog } from "./ProductionMachineFormDialog"

const ALL_VALUE = "__all__"

const SHIFT_SOURCE_LABELS = {
    machine: "Makine",
    area: "Alandan",
    default: "Varsayılan",
} as const

function formatPair(first: number | null, second: number | null, separator: string) {
    if (first === null && second === null) return "—"
    return `${first ?? "?"}${separator}${second ?? "?"}`
}

/** Durum rozetinin altındaki duruş uyarısı; ayrıntı sayfanın "Duruşlar" bölümünde. */
function MachineDowntimeHint({ downtimes, now }: { downtimes: MachineDowntime[] | undefined; now: Date }) {
    const state = downtimes ? describeMachineDowntimeState(downtimes, now) : null
    if (!state) return null

    const isActive = state.status === "active"
    return (
        <a
            href="#duruslar"
            className={cn(
                "mt-1 block text-xs hover:underline",
                isActive ? "font-medium text-red-700 dark:text-red-400" : "text-muted-foreground",
            )}
        >
            {isActive
                ? `Duruşta · bitiş ${formatProductionShortDateTime(state.downtime.endAt)}`
                : `Duruş: ${formatProductionShortDateTime(state.downtime.startAt)}`}
        </a>
    )
}

export function ProductionMachinesPageClient() {
    // Filtreler URL'de: ekran paylaşılabilir, geri tuşu filtreyi korur (AGENTS.md).
    const [{ q: search, alan: areaId, durum: status }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        alan: parseAsString.withDefault(""),
        durum: parseAsString.withDefault(""),
    })
    const machinesQuery = useProductionMachines()
    const areasQuery = useProductionAreas()
    const shiftPatternsQuery = useShiftPatterns()
    const downtimesQuery = useRecentMachineDowntimes()
    const now = useNow()
    const deleteMutation = useDeleteProductionMachine()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductionMachine | null>(null)

    const machines = useMemo(() => machinesQuery.data ?? [], [machinesQuery.data])
    const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data])
    const shiftPatterns = useMemo(() => shiftPatternsQuery.data ?? [], [shiftPatternsQuery.data])

    const visibleMachines = useMemo(
        () => filterProductionMachines(machines, { search, areaId, status }),
        [areaId, machines, search, status],
    )

    const areaById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas])
    const patternById = useMemo(() => new Map(shiftPatterns.map((pattern) => [pattern.id, pattern])), [shiftPatterns])
    const downtimesByMachine = useMemo(() => {
        const byMachine = new Map<string, MachineDowntime[]>()
        for (const downtime of downtimesQuery.data ?? []) {
            byMachine.set(downtime.machineId, [...(byMachine.get(downtime.machineId) ?? []), downtime])
        }
        return byMachine
    }, [downtimesQuery.data])
    const defaultPatternId = shiftPatterns.find((pattern) => pattern.isDefault)?.id ?? null

    const isInitialLoading = machinesQuery.isLoading && machines.length === 0
    const isBackgroundRefetch = machinesQuery.isFetching && !isInitialLoading
    const hasFilters = Boolean(search || areaId || status)

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(machine: ProductionMachine) {
        setEditing(machine)
        setDialogOpen(true)
    }

    async function remove(machine: ProductionMachine) {
        try {
            await deleteMutation.mutateAsync(machine.id)
            toast.success("Makine silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    function describeShiftPattern(machine: ProductionMachine) {
        const effective = resolveEffectiveShiftPattern({
            machineShiftPatternId: machine.shiftPatternId,
            areaShiftPatternId: areaById.get(machine.areaId)?.shiftPatternId ?? null,
            defaultShiftPatternId: defaultPatternId,
        })
        if (!effective.patternId || !effective.source) return null
        return {
            name: patternById.get(effective.patternId)?.name ?? "—",
            source: SHIFT_SOURCE_LABELS[effective.source],
        }
    }

    const noAreas = !areasQuery.isLoading && areas.length === 0

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Factory />}
                title="Makineler"
                description="Enjeksiyon makineleri ve kalıp uyumu için teknik değerleri: kapama kuvveti, kolonlar arası mesafe, kalıp kalınlığı aralığı. Boş teknik değer kaydı engellemez."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate} disabled={noAreas}>
                        <Plus className="h-4 w-4" />
                        Yeni Makine
                    </Button>
                )}
            />

            {noAreas ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Warehouse />
                        </EmptyMedia>
                        <EmptyTitle>Önce bir parkur / alan tanımlayın</EmptyTitle>
                        <EmptyDescription>Her makine bir alanda durur; tahtada satırlar alanlara göre gruplanır.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href="/uretim/alanlar">Alanlara git</Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_12rem]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => void setFilters({ q: event.target.value || null })}
                                placeholder="Kod, ad, marka veya model ara"
                                aria-label="Makine ara"
                                className="ps-9"
                            />
                        </div>
                        <Select
                            value={areaId || ALL_VALUE}
                            onValueChange={(value) => void setFilters({ alan: value === ALL_VALUE ? null : value })}
                        >
                            <SelectTrigger className="w-full" aria-label="Alana göre filtrele">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_VALUE}>Tüm alanlar</SelectItem>
                                {areas.map((area) => (
                                    <SelectItem key={area.id} value={area.id}>
                                        {area.code} · {area.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={status || ALL_VALUE}
                            onValueChange={(value) => void setFilters({ durum: value === ALL_VALUE ? null : value })}
                        >
                            <SelectTrigger className="w-full" aria-label="Duruma göre filtrele">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_VALUE}>Tüm durumlar</SelectItem>
                                {MACHINE_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isInitialLoading ? (
                        <Skeleton className="h-64 rounded-2xl" />
                    ) : visibleMachines.length === 0 ? (
                        <Empty className="border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Factory />
                                </EmptyMedia>
                                <EmptyTitle>{hasFilters ? "Filtreyle eşleşen makine yok" : "Henüz makine yok"}</EmptyTitle>
                                <EmptyDescription>
                                    {hasFilters
                                        ? "Filtreleri temizleyip tekrar deneyin."
                                        : "Parkurdaki enjeksiyon makinelerini ekleyin; yalnız kod, ad, alan ve kapama kuvveti zorunlu."}
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                {hasFilters ? (
                                    <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, alan: null, durum: null })}>
                                        Filtreleri temizle
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={openCreate}>
                                        <Plus className="h-4 w-4" />
                                        İlk makineyi ekle
                                    </Button>
                                )}
                            </EmptyContent>
                        </Empty>
                    ) : (
                        <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                            <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kod</TableHead>
                                        <TableHead>Makine</TableHead>
                                        <TableHead>Alan</TableHead>
                                        <TableHead className="text-end">Tonaj</TableHead>
                                        <TableHead>Kolonlar arası</TableHead>
                                        <TableHead>Kalıp kalınlığı</TableHead>
                                        <TableHead>Vardiya düzeni</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="w-24 text-end">
                                            <span className="sr-only">İşlemler</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleMachines.map((machine) => {
                                        const pattern = describeShiftPattern(machine)
                                        const brandModel = [machine.brand, machine.model].filter(Boolean).join(" ")

                                        return (
                                            <TableRow key={machine.id}>
                                                <TableCell className="font-medium">{machine.code}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{machine.name}</div>
                                                    {brandModel ? <div className="text-xs text-muted-foreground">{brandModel}</div> : null}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{machine.area.name}</TableCell>
                                                <TableCell className="text-end tabular-nums">{machine.clampForceTon} t</TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatPair(machine.tieBarHorizontalMm, machine.tieBarVerticalMm, " × ")}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatPair(machine.minMoldHeightMm, machine.maxMoldHeightMm, "–")}
                                                </TableCell>
                                                <TableCell>
                                                    {pattern ? (
                                                        <div>
                                                            <div>{pattern.name}</div>
                                                            <div className="text-xs text-muted-foreground">{pattern.source}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Tanımsız</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("rounded-full", MACHINE_STATUS_BADGE_CLASSES[machine.status])}>
                                                        {MACHINE_STATUS_LABELS[machine.status]}
                                                    </Badge>
                                                    <MachineDowntimeHint downtimes={downtimesByMachine.get(machine.id)} now={now} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`${machine.code} düzenle`}
                                                            onClick={() => openEdit(machine)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <ConfirmDeleteDialog
                                                            trigger={(
                                                                <Button type="button" variant="ghost" size="icon" aria-label={`${machine.code} sil`}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            title="Makine silinsin mi?"
                                                            description="Makine ile birlikte kalıp-makine kartları, duruş kayıtları ve makineye özel takvim istisnaları silinir. Kullanılmayan bir makine için durumu 'Kullanım dışı' yapmak da yeterli."
                                                            itemNames={[`${machine.code} · ${machine.name}`]}
                                                            onConfirm={() => void remove(machine)}
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
                </>
            )}

            <ProductionMachineFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                machine={editing}
                areas={areas}
                shiftPatterns={shiftPatterns}
            />
        </div>
    )
}
