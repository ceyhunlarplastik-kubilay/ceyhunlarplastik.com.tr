"use client"

import Link from "next/link"
import { useState } from "react"
import { FileText, Pencil, Plus, Trash2, Upload } from "lucide-react"
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
import type { Material } from "@/features/admin/materials/api/types"
import { MaterialFormDialog } from "@/features/admin/materials/components/MaterialFormDialog"
import {
    useDeleteMaterial,
    useDeleteMaterialAsset,
} from "@/features/admin/materials/hooks/useMaterialMutations"

type Props = {
    materials: Material[]
    isFetching?: boolean
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value))
}

function getCertificates(material: Material) {
    return (material.assets ?? []).filter(
        (asset) => asset.type === "PDF" && asset.role === "CERTIFICATE",
    )
}

export function MaterialsTable({ materials, isFetching = false }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
    const deleteMaterialMutation = useDeleteMaterial()
    const deleteAssetMutation = useDeleteMaterialAsset()

    function openCreateDialog() {
        setEditingMaterial(null)
        setDialogOpen(true)
    }

    function openEditDialog(material: Material) {
        setEditingMaterial(material)
        setDialogOpen(true)
    }

    function handleDeleteMaterial(material: Material) {
        const confirmed = window.confirm(
            `"${material.name}" ham maddesini silmek istediğine emin misin? Bu işlem geri alınamaz.`,
        )
        if (!confirmed) return

        deleteMaterialMutation.mutate(material.id)
    }

    function handleDeleteCertificate(assetId: string) {
        const confirmed = window.confirm("Bu sertifikayı silmek istediğine emin misin?")
        if (!confirmed) return

        deleteAssetMutation.mutate(assetId)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button type="button" className="gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    Yeni Ham Madde
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ham Madde</TableHead>
                            <TableHead className="w-[130px]">Kod</TableHead>
                            <TableHead>Sertifikalar</TableHead>
                            <TableHead className="w-[130px]">Güncellenme</TableHead>
                            <TableHead className="w-[170px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {materials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-sm text-neutral-500">
                                    {isFetching ? "Ham maddeler yükleniyor..." : "Ham madde bulunamadı."}
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {materials.map((material) => {
                            const certificates = getCertificates(material)

                            return (
                                <TableRow key={material.id}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-medium text-neutral-950">{material.name}</div>
                                            <div className="text-xs text-neutral-500">{material.id}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {material.code ? (
                                            <Badge variant="secondary">{material.code}</Badge>
                                        ) : (
                                            <span className="text-sm text-neutral-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {certificates.length === 0 ? (
                                            <span className="text-sm text-neutral-400">Sertifika yok</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {certificates.map((asset, index) => (
                                                    <div
                                                        key={asset.id}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 text-red-600" />
                                                        <Link
                                                            href={asset.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-neutral-700 hover:text-brand"
                                                        >
                                                            Sertifika {index + 1}
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="rounded-full p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => handleDeleteCertificate(asset.id)}
                                                            disabled={deleteAssetMutation.isPending}
                                                            aria-label="Sertifikayı sil"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-500">
                                        {formatDate(material.updatedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                onClick={() => openEditDialog(material)}
                                            >
                                                <Upload className="h-4 w-4" />
                                                Sertifika
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEditDialog(material)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                disabled={deleteMaterialMutation.isPending}
                                                onClick={() => handleDeleteMaterial(material)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <MaterialFormDialog
                open={dialogOpen}
                material={editingMaterial}
                onOpenChange={setDialogOpen}
            />
        </div>
    )
}
