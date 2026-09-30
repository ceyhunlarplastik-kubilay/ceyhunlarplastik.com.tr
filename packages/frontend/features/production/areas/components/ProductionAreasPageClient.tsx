"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2, Warehouse } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { ProductionArea } from "@/features/production/areas/api/types"
import { useDeleteProductionArea, useProductionAreas } from "@/features/production/areas/hooks/useProductionAreas"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { ProductionAreaFormDialog } from "./ProductionAreaFormDialog"

export function ProductionAreasPageClient() {
    const areasQuery = useProductionAreas()
    const deleteMutation = useDeleteProductionArea()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductionArea | null>(null)

    const areas = areasQuery.data ?? []
    const isInitialLoading = areasQuery.isLoading && areas.length === 0
    const isBackgroundRefetch = areasQuery.isFetching && !isInitialLoading

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(area: ProductionArea) {
        setEditing(area)
        setDialogOpen(true)
    }

    async function remove(area: ProductionArea) {
        try {
            await deleteMutation.mutateAsync(area.id)
            toast.success("Alan silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Warehouse />}
                title="Parkur ve Alanlar"
                description="Makinelerin durduğu parkur / hol / bölümler. Planlama tahtasında makine satırları alanlara göre gruplanır; alan, makinelerine varsayılan vardiya düzeni verebilir."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Alan
                    </Button>
                )}
            />

            {isInitialLoading ? (
                <Skeleton className="h-48 rounded-2xl" />
            ) : areas.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Warehouse />
                        </EmptyMedia>
                        <EmptyTitle>Henüz alan yok</EmptyTitle>
                        <EmptyDescription>
                            Makine eklemeden önce en az bir parkur / alan tanımlayın (ör. &quot;Parkur 1&quot;).
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            İlk alanı oluştur
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod</TableHead>
                                <TableHead>Ad</TableHead>
                                <TableHead>Vardiya düzeni</TableHead>
                                <TableHead className="text-end">Makine</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-24 text-end">
                                    <span className="sr-only">İşlemler</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="font-medium">{area.code}</TableCell>
                                    <TableCell>{area.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {area.shiftPattern?.name ?? "Varsayılan düzen"}
                                    </TableCell>
                                    <TableCell className="text-end tabular-nums">{area.machineCount}</TableCell>
                                    <TableCell>
                                        <Badge variant={area.isActive ? "secondary" : "outline"} className="rounded-full">
                                            {area.isActive ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button type="button" variant="ghost" size="icon" aria-label={`${area.name} düzenle`} onClick={() => openEdit(area)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <ConfirmDeleteDialog
                                                trigger={(
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`${area.name} sil`}
                                                        disabled={area.machineCount > 0}
                                                        title={area.machineCount > 0 ? "Alanda makine var" : undefined}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                title="Alan silinsin mi?"
                                                description="Alan ve alana özel takvim istisnaları kalıcı olarak silinir."
                                                itemNames={[`${area.code} · ${area.name}`]}
                                                onConfirm={() => void remove(area)}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ProductionAreaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} area={editing} />
        </div>
    )
}
