"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { MaterialMultiSelect } from "@/features/admin/productVariantMatrix/components/MaterialMultiSelect"
import type { MatrixRequirement } from "@/features/admin/productVariantMatrix/api/types"
import type { VariantMatrixDraftRow } from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"

type ReferenceOption = { id: string; name: string; code?: string | null }

type Props = {
    row: VariantMatrixDraftRow
    index: number
    requirements: MatrixRequirement[]
    colors: Array<ReferenceOption & { hex?: string }>
    materials: ReferenceOption[]
    suppliers: ReferenceOption[]
    errors: string[]
    /** Satırın alacağı kod (tahmin) — kesin kod kaydetmede sunucuda üretilir. */
    codePreview?: { fullCode: string | null; supplierFullCode: string | null }
    onChange: (patch: Partial<VariantMatrixDraftRow>) => void
    onDuplicate: () => void
    onRemove: () => void
}

/**
 * Tek taslak satır. Ölçü kolonları ürün modelinin ŞABLONUNDAN gelir — operatör
 * hangi ölçüyü gireceğini tahmin etmez, kolon başlıkları standardı dayatır.
 *
 * Lojistik alanları (logo, koli, termin) satır başına açılır bir alt alanda:
 * hepsini aynı satıra koymak tabloyu okunmaz genişliğe çıkarıyordu.
 */
export function VariantMatrixDraftRow({
    row,
    index,
    requirements,
    colors,
    materials,
    suppliers,
    errors,
    codePreview,
    onChange,
    onDuplicate,
    onRemove,
}: Props) {
    const [detailOpen, setDetailOpen] = useState(false)
    const hasError = errors.length > 0

    return (
        <>
            <TableRow className={cn(hasError && "bg-red-50/60 dark:bg-red-950/20")}>
                <TableCell className="w-8 align-middle">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setDetailOpen((open) => !open)}
                        aria-label={detailOpen ? "Detayı kapat" : "Detayı aç"}
                        aria-expanded={detailOpen}
                    >
                        {detailOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                </TableCell>

                {requirements.map((requirement) => (
                    <TableCell key={requirement.id} className="min-w-28">
                        <Input
                            value={row.measurements[requirement.id] ?? ""}
                            placeholder={requirement.unit ?? ""}
                            aria-label={requirement.label}
                            onChange={(event) =>
                                onChange({
                                    measurements: { ...row.measurements, [requirement.id]: event.target.value },
                                })
                            }
                        />
                    </TableCell>
                ))}

                <TableCell className="min-w-36">
                    <Select
                        value={row.colorId ?? ""}
                        onValueChange={(value) => onChange({ colorId: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Renk" />
                        </SelectTrigger>
                        <SelectContent>
                            {colors.map((color) => (
                                <SelectItem key={color.id} value={color.id}>
                                    <span className="flex items-center gap-2">
                                        {color.hex ? (
                                            <span
                                                className="size-3 rounded-full border"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        ) : null}
                                        {color.code ? `${color.code} — ` : ""}{color.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>

                <TableCell className="min-w-40">
                    <MaterialMultiSelect
                        materials={materials}
                        value={row.materialIds}
                        onChange={(materialIds) => onChange({ materialIds })}
                    />
                </TableCell>

                <TableCell className="min-w-40">
                    <Select
                        value={row.supplierId ?? ""}
                        onValueChange={(value) => onChange({ supplierId: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tedarikçi" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>

                <TableCell className="min-w-32">
                    <Input
                        value={row.supplierVariantCode ?? ""}
                        placeholder="AS231"
                        aria-label="Tedarikçi kodu"
                        onChange={(event) => onChange({ supplierVariantCode: event.target.value })}
                    />
                </TableCell>

                <TableCell className="min-w-28">
                    <Input
                        value={row.price ?? ""}
                        placeholder="0,00"
                        inputMode="decimal"
                        aria-label="Tedarikçi liste fiyatı (alış)"
                        onChange={(event) => onChange({ price: event.target.value })}
                    />
                </TableCell>

                <TableCell className="min-w-28">
                    {codePreview?.supplierFullCode || codePreview?.fullCode ? (
                        <span className="font-mono text-xs text-blue-700 dark:text-blue-400">
                            {codePreview.supplierFullCode ?? codePreview.fullCode}
                        </span>
                    ) : (
                        <span className="text-xs text-neutral-400">—</span>
                    )}
                </TableCell>

                <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={onDuplicate}
                            aria-label="Satırı çoğalt"
                        >
                            <Copy className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={onRemove}
                            aria-label="Satırı sil"
                        >
                            <Trash2 className="size-4 text-red-600" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {hasError ? (
                <TableRow className="bg-red-50/60 dark:bg-red-950/20">
                    <TableCell colSpan={requirements.length + 7} className="py-1 text-xs text-red-700 dark:text-red-400">
                        Satır {index + 1}: {errors.join(" · ")}
                    </TableCell>
                </TableRow>
            ) : null}

            {detailOpen ? (
                <TableRow className="bg-neutral-50/70 dark:bg-neutral-900/40">
                    <TableCell colSpan={requirements.length + 7} className="py-3">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                            <div className="flex flex-col justify-end gap-2 pb-1">
                                <Label className="text-xs">Tedarikçi logosu</Label>
                                <Checkbox
                                    checked={row.hasSupplierLogo}
                                    onCheckedChange={(checked) => onChange({ hasSupplierLogo: checked === true })}
                                    aria-label="Ürün üzerinde tedarikçi logosu var"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Min. sipariş</Label>
                                <Input
                                    value={row.minOrderQty ?? ""}
                                    inputMode="numeric"
                                    onChange={(event) => onChange({ minOrderQty: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Kolideki adet</Label>
                                <Input
                                    value={row.unitsPerPackage ?? ""}
                                    inputMode="numeric"
                                    onChange={(event) => onChange({ unitsPerPackage: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Koli boy (mm)</Label>
                                <Input
                                    value={row.packageLengthMm ?? ""}
                                    inputMode="decimal"
                                    onChange={(event) => onChange({ packageLengthMm: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Koli en (mm)</Label>
                                <Input
                                    value={row.packageWidthMm ?? ""}
                                    inputMode="decimal"
                                    onChange={(event) => onChange({ packageWidthMm: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Koli yükseklik (mm)</Label>
                                <Input
                                    value={row.packageHeightMm ?? ""}
                                    inputMode="decimal"
                                    onChange={(event) => onChange({ packageHeightMm: event.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Termin (gün)</Label>
                                <Input
                                    value={row.minLeadTimeDays ?? ""}
                                    inputMode="numeric"
                                    onChange={(event) => onChange({ minLeadTimeDays: event.target.value })}
                                />
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            ) : null}
        </>
    )
}
