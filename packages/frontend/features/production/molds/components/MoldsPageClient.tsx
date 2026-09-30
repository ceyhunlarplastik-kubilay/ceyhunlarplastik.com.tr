"use client"

import { useMemo, useState } from "react"
import { parseAsString, useQueryStates } from "nuqs"
import { Boxes, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { moldMaintenanceStatus } from "@core/helpers/production/moldMaintenance"
import { sumCavities } from "@core/helpers/production/molds"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { useProductionMachines } from "@/features/production/machines/hooks/useProductionMachines"
import type { Mold } from "@/features/production/molds/api/types"
import { useDeleteMold, useMolds, useRecordMoldMaintenance } from "@/features/production/molds/hooks/useMolds"
import { filterMolds } from "@/features/production/molds/lib/filterMolds"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import {
    MOLD_STATUS_BADGE_CLASSES,
    MOLD_STATUS_LABELS,
    MOLD_STATUS_OPTIONS,
} from "@/features/production/shared/moldStatus"
import { cn } from "@/lib/utils"
import { MoldFormDialog } from "./MoldFormDialog"

const ALL_VALUE = "__all__"

/** Kalıp formuyla aynı sözleşme: bakım GÜNÜ (UTC gece yarısı) — saat gösterilmez. */
function lastMaintenanceLabel(mold: Mold) {
    return mold.lastMaintenanceAt ? `son bakım ${formatDateKey(mold.lastMaintenanceAt.slice(0, 10))}` : "bakım kaydı yok"
}

function MaintenanceCell({ mold }: { mold: Mold }) {
    // Tahtadaki uyarıyla aynı kaynak (`core/helpers/production/moldMaintenance.ts`).
    const status = moldMaintenanceStatus(mold)
    if (status.level === "NONE" || status.intervalShots === null) {
        return <span className="text-muted-foreground" title={lastMaintenanceLabel(mold)}>—</span>
    }

    const percent = Math.round((status.ratio ?? 0) * 100)
    const label = status.level === "DUE" ? "Zamanı geldi" : status.level === "SOON" ? "Yaklaşıyor" : `%${percent}`

    return (
        <span
            className={cn(
                "tabular-nums",
                status.level === "DUE" && "font-medium text-destructive",
                status.level === "SOON" && "font-medium text-amber-700 dark:text-amber-400",
                status.level === "OK" && "text-muted-foreground",
            )}
            title={`${status.shotsSinceMaintenance.toLocaleString("tr-TR")} / ${status.intervalShots.toLocaleString("tr-TR")} baskı · ${lastMaintenanceLabel(mold)}`}
        >
            {label}
        </span>
    )
}

export function MoldsPageClient() {
    // Filtreler URL'de: ekran paylaşılabilir, geri tuşu filtreyi korur (AGENTS.md).
    const [{ q: search, durum: status }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        durum: parseAsString.withDefault(""),
    })
    const moldsQuery = useMolds()
    const machinesQuery = useProductionMachines()
    const deleteMutation = useDeleteMold()
    const maintenanceMutation = useRecordMoldMaintenance()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Mold | null>(null)

    const molds = useMemo(() => moldsQuery.data ?? [], [moldsQuery.data])
    const visibleMolds = useMemo(() => filterMolds(molds, { search, status }), [molds, search, status])

    const isInitialLoading = moldsQuery.isLoading && molds.length === 0
    const isBackgroundRefetch = moldsQuery.isFetching && !isInitialLoading
    const hasFilters = Boolean(search || status)

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(mold: Mold) {
        setEditing(mold)
        setDialogOpen(true)
    }

    async function recordMaintenance(mold: Mold) {
        try {
            await maintenanceMutation.mutateAsync(mold.id)
            toast.success(`${mold.code} bakımı kaydedildi; sayaç sıfırlandı`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    async function remove(mold: Mold) {
        try {
            await deleteMutation.mutateAsync(mold.id)
            toast.success("Kalıp silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Boxes />}
                title="Kalıplar"
                description="Kalıplar ürün modelinin ölçüsüne bağlanır; aile kalıbında farklı ölçüler ve farklı ürün modelleri olabilir. Çevrim, göz sayısı ve makine gereksinimleri planlamanın temelidir."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Kalıp
                    </Button>
                )}
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => void setFilters({ q: event.target.value || null })}
                        placeholder="Kalıp kodu, ad, ölçü kodu (1.3.8) veya ürün modeli ara"
                        aria-label="Kalıp ara"
                        className="ps-9"
                    />
                </div>
                <Select
                    value={status || ALL_VALUE}
                    onValueChange={(value) => void setFilters({ durum: value === ALL_VALUE ? null : value })}
                >
                    <SelectTrigger className="w-full" aria-label="Duruma göre filtrele">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tüm durumlar</SelectItem>
                        {MOLD_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : visibleMolds.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Boxes />
                        </EmptyMedia>
                        <EmptyTitle>{hasFilters ? "Filtreyle eşleşen kalıp yok" : "Henüz kalıp yok"}</EmptyTitle>
                        <EmptyDescription>
                            {hasFilters
                                ? "Filtreleri temizleyip tekrar deneyin."
                                : "Kalıbı ekleyip hangi ölçüleri kaç gözle bastığını tanımlayın; yalnız kod, ad ve çevrim zorunlu."}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        {hasFilters ? (
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, durum: null })}>
                                Filtreleri temizle
                            </Button>
                        ) : (
                            <Button type="button" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                İlk kalıbı ekle
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
                                <TableHead>Kalıp</TableHead>
                                <TableHead>Bastığı ölçüler</TableHead>
                                <TableHead className="text-end">Göz</TableHead>
                                <TableHead className="text-end">Tonaj</TableHead>
                                <TableHead className="text-end">Çevrim</TableHead>
                                <TableHead>Bakım</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-32 text-end">
                                    <span className="sr-only">İşlemler</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleMolds.map((mold) => (
                                <TableRow key={mold.id}>
                                    <TableCell className="font-medium">{mold.code}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{mold.name}</div>
                                        {mold.storageLocation ? (
                                            <div className="text-xs text-muted-foreground">{mold.storageLocation}</div>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>
                                        {mold.outputs.length === 0 ? (
                                            <span className="text-xs text-amber-700 dark:text-amber-400">Ölçü bağlanmadı</span>
                                        ) : (
                                            <div className="flex max-w-72 flex-wrap gap-1">
                                                {mold.outputs.map((output) => (
                                                    <Badge
                                                        key={output.id}
                                                        variant="outline"
                                                        className="rounded-full font-normal"
                                                        title={`${output.product.name} · ${output.size.label}`}
                                                    >
                                                        {output.size.sizeCode} × {output.cavities}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-end tabular-nums">{sumCavities(mold.outputs)}</TableCell>
                                    <TableCell className="text-end tabular-nums text-muted-foreground">
                                        {mold.requiredClampForceTon !== null ? `${mold.requiredClampForceTon} t` : "—"}
                                    </TableCell>
                                    <TableCell className="text-end tabular-nums">
                                        {mold.standardCycleTimeSec.toLocaleString("tr-TR")} sn
                                    </TableCell>
                                    <TableCell>
                                        <MaintenanceCell mold={mold} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("rounded-full", MOLD_STATUS_BADGE_CLASSES[mold.status])}>
                                            {MOLD_STATUS_LABELS[mold.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {mold.maintenanceIntervalShots ? (
                                                <ConfirmDeleteDialog
                                                    trigger={(
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`${mold.code} bakım yapıldı`}
                                                            title="Bakım yapıldı"
                                                            disabled={maintenanceMutation.isPending}
                                                        >
                                                            <Wrench className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    title="Bakım yapıldı olarak kaydedilsin mi?"
                                                    description={`Son bakım sayacı güncel baskı sayacına (${mold.totalShots.toLocaleString("tr-TR")}) eşitlenir ve bakım günü bugün yazılır; bakım uyarısı sıfırlanır. Geçmiş bir bakımı kalıp formundan girebilirsiniz.`}
                                                    itemNames={[`${mold.code} · ${mold.name}`]}
                                                    confirmLabel="Bakım yapıldı"
                                                    onConfirm={() => void recordMaintenance(mold)}
                                                />
                                            ) : null}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`${mold.code} düzenle`}
                                                onClick={() => openEdit(mold)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <ConfirmDeleteDialog
                                                trigger={(
                                                    <Button type="button" variant="ghost" size="icon" aria-label={`${mold.code} sil`}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                title="Kalıp silinsin mi?"
                                                description="Kalıp ile birlikte göz grupları ve makine kartları silinir. Kullanılmayan bir kalıp için durumu 'Kullanım dışı' yapmak da yeterli."
                                                itemNames={[`${mold.code} · ${mold.name}`]}
                                                onConfirm={() => void remove(mold)}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <MoldFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mold={editing}
                machines={machinesQuery.data ?? []}
            />
        </div>
    )
}
