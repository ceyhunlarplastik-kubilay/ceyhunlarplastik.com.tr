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
import type { Color } from "@/features/admin/colors/api/types"
import { ColorFormDialog } from "@/features/admin/colors/components/ColorFormDialog"
import { useDeleteColor } from "@/features/admin/colors/hooks/useColorMutations"

type Props = {
    colors: Color[]
    isFetching?: boolean
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value))
}

export function ColorsTable({ colors, isFetching = false }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingColor, setEditingColor] = useState<Color | null>(null)
    const deleteColorMutation = useDeleteColor()

    function openCreateDialog() {
        setEditingColor(null)
        setDialogOpen(true)
    }

    function openEditDialog(color: Color) {
        setEditingColor(color)
        setDialogOpen(true)
    }

    function handleDeleteColor(color: Color) {
        const confirmed = window.confirm(
            `"${color.name}" rengini silmek istediğine emin misin? Bu işlem geri alınamaz.`,
        )
        if (!confirmed) return

        deleteColorMutation.mutate(color.id)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button type="button" className="gap-2" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    Yeni Renk
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Renk</TableHead>
                            <TableHead className="w-[130px]">Sistem</TableHead>
                            <TableHead className="w-[140px]">Kod</TableHead>
                            <TableHead className="w-[130px]">Hex</TableHead>
                            <TableHead className="w-[110px]">Durum</TableHead>
                            <TableHead className="w-[130px]">Güncellenme</TableHead>
                            <TableHead className="w-[120px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {colors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-sm text-neutral-500">
                                    {isFetching ? "Renkler yükleniyor..." : "Renk bulunamadı."}
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {colors.map((color) => (
                            <TableRow key={color.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="h-9 w-9 rounded-md border border-neutral-200 shadow-inner"
                                            style={{ backgroundColor: color.hex }}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0 space-y-1">
                                            <div className="font-medium text-neutral-950">{color.name}</div>
                                            <div className="truncate text-xs text-neutral-500">{color.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{color.system}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-neutral-700">
                                    {color.code}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-neutral-700">
                                    {color.hex}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={color.isActive ? "default" : "secondary"}>
                                        {color.isActive ? "Aktif" : "Pasif"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-neutral-500">
                                    {formatDate(color.updatedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog(color)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            disabled={deleteColorMutation.isPending}
                                            onClick={() => handleDeleteColor(color)}
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

            <ColorFormDialog
                open={dialogOpen}
                color={editingColor}
                onOpenChange={setDialogOpen}
            />
        </div>
    )
}
