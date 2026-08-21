"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight, Copy, Loader2, Pencil, Trash2 } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { EditVariantSupplierDialog } from "@/features/admin/productVariantMatrix/components/EditVariantSupplierDialog"
import {
    useDeleteVariantRow,
    useDeleteVariantSupplier,
    useUpdateVariantSupplier,
} from "@/features/admin/productVariantMatrix/hooks/useVariantRowActions"
import type { MatrixRowSupplier } from "@/features/admin/productVariantMatrix/api/types"

import type {
    MatrixRequirement,
    MatrixRow,
    MatrixSize,
    MatrixVersion,
} from "@/features/admin/productVariantMatrix/api/types"

type ReferenceOption = { id: string; name: string; code?: string | null }

type Props = {
    productId: string
    rows: MatrixRow[]
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    requirements: MatrixRequirement[]
    colors: Array<ReferenceOption & { hex?: string }>
    materials: ReferenceOption[]
    supplierCodes: Array<{ supplierId: string; supplierName: string; code: string }>
    /** Satırı taslak olarak yeniden açar — benzer varyantları hızlı girmek için. */
    onDuplicateToDraft: (row: MatrixRow, supplier?: MatrixRowSupplier) => void
    emptyMessage?: string
}

/**
 * Kayıtlı varyantlar — salt okunur.
 *
 * Bir satır BİR fiziksel ürünü temsil eder; tedarikçiler o satırın altında harf
 * rozetleri olarak görünür. Eski modelde her tedarikçi ayrı satırdı ve aynı ürün
 * tabloda tekrar tekrar görünüyordu.
 */
export function VariantMatrixExistingTable({
    productId,
    rows,
    sizes,
    versions,
    requirements,
    colors,
    materials,
    supplierCodes,
    onDuplicateToDraft,
    emptyMessage,
}: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [editing, setEditing] = useState<{ supplier: MatrixRowSupplier; name: string } | null>(null)

    const updateSupplier = useUpdateVariantSupplier(productId)
    const deleteSupplier = useDeleteVariantSupplier(productId)
    const deleteVariant = useDeleteVariantRow(productId)

    const sizeById = new Map(sizes.map((size) => [size.id, size]))
    const versionById = new Map(versions.map((version) => [version.id, version]))
    const colorById = new Map(colors.map((color) => [color.id, color]))
    const materialById = new Map(materials.map((material) => [material.id, material]))
    const supplierNameById = new Map(supplierCodes.map((entry) => [entry.supplierId, entry.supplierName]))

    if (rows.length === 0) {
        return (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                {emptyMessage ?? "Bu ürün modelinde henüz varyant yok. Aşağıdan satır ekleyerek başlayın."}
            </p>
        )
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8" />
                        <TableHead className="min-w-40">Kod</TableHead>
                        {requirements.map((requirement) => (
                            <TableHead key={requirement.id} className="min-w-24">
                                {requirement.label}
                                {requirement.unit ? (
                                    <span className="ml-1 text-xs font-normal text-neutral-500">
                                        ({requirement.unit})
                                    </span>
                                ) : null}
                            </TableHead>
                        ))}
                        <TableHead>Versiyon</TableHead>
                        <TableHead>Renk</TableHead>
                        <TableHead>Hammadde</TableHead>
                        <TableHead>Tedarikçiler</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const size = sizeById.get(row.sizeId)
                        const version = versionById.get(row.versionId)
                        const color = version?.colorId ? colorById.get(version.colorId) : null
                        const valueByRequirement = new Map(
                            (size?.values ?? []).map((value) => [value.requirementId, value.value]),
                        )

                        const isExpanded = expandedId === row.variantId

                        return (
                            <Fragment key={row.variantId}>
                            <TableRow>
                                <TableCell className="w-8">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        onClick={() => setExpandedId(isExpanded ? null : row.variantId)}
                                        aria-label={isExpanded ? "Detayı kapat" : "Detayı aç"}
                                        aria-expanded={isExpanded}
                                    >
                                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                    </Button>
                                </TableCell>
                                <TableCell className="font-mono text-sm font-medium">{row.fullCode}</TableCell>

                                {requirements.map((requirement) => (
                                    <TableCell key={requirement.id} className="tabular-nums">
                                        {valueByRequirement.get(requirement.id) ?? "—"}
                                    </TableCell>
                                ))}

                                <TableCell>
                                    <Badge variant="secondary" className="font-mono">{version?.code ?? "—"}</Badge>
                                </TableCell>

                                <TableCell>
                                    {color ? (
                                        <span className="flex items-center gap-2 text-sm">
                                            {color.hex ? (
                                                <span
                                                    className="size-3 shrink-0 rounded-full border"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                            ) : null}
                                            {color.name}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-400">—</span>
                                    )}
                                </TableCell>

                                <TableCell className="text-sm">
                                    {(version?.materialIds ?? [])
                                        .map((id) => materialById.get(id))
                                        .filter(Boolean)
                                        .map((material) => material!.code ?? material!.name)
                                        .join(", ") || <span className="text-neutral-400">—</span>}
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {row.suppliers.length === 0 ? (
                                            <span className="text-neutral-400">—</span>
                                        ) : (
                                            row.suppliers.map((supplier) => (
                                                <Badge
                                                    key={supplier.id}
                                                    variant="outline"
                                                    className="font-mono"
                                                    title={supplierNameById.get(supplier.supplierId) ?? undefined}
                                                >
                                                    {supplier.supplierCode ?? "?"}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        aria-label="Satırı taslağa kopyala"
                                        title="Bu satırın değerleriyle yeni bir taslak satır aç"
                                        onClick={() => onDuplicateToDraft(row)}
                                    >
                                        <Copy className="size-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="size-7"
                                                aria-label="Varyantı sil"
                                                disabled={deleteVariant.isPending}
                                            >
                                                <Trash2 className="size-4 text-red-600" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Varyantı sil</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <span className="font-mono">{row.fullCode}</span> ve bağlı tüm
                                                    tedarikçi satırları silinir. Kullanılmayan ölçü ve versiyon
                                                    kayıtları temizlenir; ürün taslak modundaysa kodlar yeniden
                                                    sıralanır. Sipariş veya iş talebinde geçen varyantlar silinemez.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteVariant.mutate(row.variantId)}>
                                                    Sil
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {isExpanded ? (
                                <TableRow className="bg-neutral-50/70 dark:bg-neutral-900/40">
                                    <TableCell colSpan={requirements.length + 6} className="py-3">
                                        {row.suppliers.length === 0 ? (
                                            <p className="text-sm text-neutral-500">
                                                Bu varyanta bağlı tedarikçi yok. Yeni satır girerek ekleyebilirsiniz.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {row.suppliers.map((supplier) => {
                                                    const name = supplierNameById.get(supplier.supplierId) ?? "Tedarikçi"
                                                    return (
                                                        <div
                                                            key={supplier.id}
                                                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white px-3 py-2 dark:bg-neutral-950"
                                                        >
                                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                                <Badge variant="outline" className="font-mono">
                                                                    {supplier.supplierCode ?? "?"}
                                                                </Badge>
                                                                <span className="font-medium">{name}</span>
                                                                {supplier.fullCode ? (
                                                                    <span className="font-mono text-xs text-neutral-500">
                                                                        {supplier.fullCode}
                                                                    </span>
                                                                ) : null}
                                                                {supplier.supplierVariantCode ? (
                                                                    <span className="text-xs text-neutral-500">
                                                                        Tedarikçi kodu: {supplier.supplierVariantCode}
                                                                    </span>
                                                                ) : null}
                                                                {supplier.minOrderQty != null ? (
                                                                    <span className="text-xs text-neutral-500">
                                                                        Min. sipariş: {supplier.minOrderQty}
                                                                    </span>
                                                                ) : null}
                                                                {supplier.minLeadTimeDays != null ? (
                                                                    <span className="text-xs text-neutral-500">
                                                                        Termin: {supplier.minLeadTimeDays} gün
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            <div className="flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => onDuplicateToDraft(row, supplier)}
                                                                    title="Bu tedarikçinin değerleriyle taslak satır aç"
                                                                >
                                                                    <Copy className="mr-1 size-3.5" />
                                                                    Kopyala
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setEditing({ supplier, name })}
                                                                >
                                                                    <Pencil className="mr-1 size-3.5" />
                                                                    Düzenle
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="size-8"
                                                                            aria-label="Tedarikçiyi kaldır"
                                                                            disabled={deleteSupplier.isPending}
                                                                        >
                                                                            {deleteSupplier.isPending ? (
                                                                                <Loader2 className="size-4 animate-spin" />
                                                                            ) : (
                                                                                <Trash2 className="size-4 text-red-600" />
                                                                            )}
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Tedarikçiyi kaldır</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                {name} bu varyanttan kaldırılır. Varyant ve
                                                                                diğer tedarikçileri durur. Tedarikçinin bu
                                                                                üründeki harfi ({supplier.supplierCode ?? "?"})
                                                                                korunur; tekrar eklerseniz aynı harfi alır.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => deleteSupplier.mutate(supplier.id)}
                                                                            >
                                                                                Kaldır
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : null}
                            </Fragment>
                        )
                    })}
                </TableBody>
            </Table>

            {editing ? (
                <EditVariantSupplierDialog
                    // key: farklı satıra geçilince form taze başlangıç değeriyle kurulur.
                    key={editing.supplier.id}
                    open
                    onOpenChange={(next) => {
                        if (!next) setEditing(null)
                    }}
                    supplier={editing.supplier}
                    supplierName={editing.name}
                    isPending={updateSupplier.isPending}
                    onSubmit={(values) => {
                        updateSupplier.mutate(
                            { supplierRowId: editing.supplier.id, values },
                            { onSuccess: () => setEditing(null) },
                        )
                    }}
                />
            ) : null}
        </div>
    )
}
