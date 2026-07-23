"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import type { MeasurementType } from "@/features/admin/measurementTypes/api/types"
import { MeasurementTypeFormDialog } from "@/features/admin/measurementTypes/components/MeasurementTypeFormDialog"
import { useDeleteMeasurementType } from "@/features/admin/measurementTypes/hooks/useMeasurementTypeMutations"

type Props = {
    measurementTypes: MeasurementType[]
    isFetching?: boolean
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value))
}

export function MeasurementTypesTable({ measurementTypes, isFetching = false }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMeasurementType, setEditingMeasurementType] = useState<MeasurementType | null>(null)
    const deleteMeasurementTypeMutation = useDeleteMeasurementType()

    function openCreateDialog() {
        setEditingMeasurementType(null)
        setDialogOpen(true)
    }

    function openEditDialog(measurementType: MeasurementType) {
        setEditingMeasurementType(measurementType)
        setDialogOpen(true)
    }

    function handleDeleteMeasurementType(measurementType: MeasurementType) {
        const confirmed = window.confirm(
            `"${measurementType.name}" ölçü tipini silmek istediğine emin misin? Bu işlem geri alınamaz.`,
        )
        if (!confirmed) return

        deleteMeasurementTypeMutation.mutate(measurementType.id)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button type="button" className="gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    Yeni Ölçü Tipi
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ölçü Tipi</TableHead>
                            <TableHead className="w-[120px]">Kod</TableHead>
                            <TableHead className="w-[120px]">Birim</TableHead>
                            <TableHead className="w-[120px]">Sıra</TableHead>
                            <TableHead className="w-[130px]">Güncellenme</TableHead>
                            <TableHead className="w-[120px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {measurementTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                                    {isFetching ? "Ölçü tipleri yükleniyor..." : "Ölçü tipi bulunamadı."}
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {measurementTypes.map((measurementType) => (
                            <TableRow key={measurementType.id}>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="font-medium text-neutral-950">{measurementType.name}</div>
                                        <div className="text-xs text-neutral-500">{measurementType.id}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{measurementType.code}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-neutral-700">
                                    {measurementType.baseUnit}
                                </TableCell>
                                <TableCell className="text-sm text-neutral-700">
                                    {measurementType.displayOrder}
                                </TableCell>
                                <TableCell className="text-sm text-neutral-500">
                                    {formatDate(measurementType.updatedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog(measurementType)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            disabled={deleteMeasurementTypeMutation.isPending}
                                            onClick={() => handleDeleteMeasurementType(measurementType)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <MeasurementTypeFormDialog
                open={dialogOpen}
                measurementType={editingMeasurementType}
                onOpenChange={setDialogOpen}
            />
        </div>
    )
}
