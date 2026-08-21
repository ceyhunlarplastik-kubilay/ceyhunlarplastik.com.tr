"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { parseOptionalInteger, parseOptionalNumber } from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"
import type { DecimalLike, MatrixRowSupplier } from "@/features/admin/productVariantMatrix/api/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier: MatrixRowSupplier | null
    supplierName: string
    isPending: boolean
    onSubmit: (values: Record<string, unknown>) => void
}

/** Prisma Decimal JSON'da {s,e,d} objesi olarak gelir; forma metin olarak koyarız. */
function decimalToText(value: DecimalLike | undefined): string {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return String(value)
    if (typeof value === "string") return value
    const { s, e, d } = value
    const digits = d.join("")
    const parsed = Number(`${s < 0 ? "-" : ""}${digits.slice(0, e + 1) || "0"}.${digits.slice(e + 1) || "0"}`)
    return Number.isFinite(parsed) ? String(parsed) : ""
}

/**
 * Tedarikçi satırının TİCARİ ve LOJİSTİK alanları.
 *
 * Ölçü, renk/hammadde ve tedarikçi kimliği burada yok: bunlar varyantın kodunu
 * belirler ve değiştirilmeleri satırı silip yeniden girmeyi gerektirir.
 */
export function EditVariantSupplierDialog({
    open,
    onOpenChange,
    supplier,
    supplierName,
    isPending,
    onSubmit,
}: Props) {
    const [form, setForm] = useState(() => ({
        price: decimalToText(supplier?.price),
        supplierVariantCode: supplier?.supplierVariantCode ?? "",
        hasSupplierLogo: supplier?.hasSupplierLogo ?? false,
        minOrderQty: supplier?.minOrderQty != null ? String(supplier.minOrderQty) : "",
        unitsPerPackage: supplier?.unitsPerPackage != null ? String(supplier.unitsPerPackage) : "",
        packageLengthMm: decimalToText(supplier?.packageLengthMm),
        packageWidthMm: decimalToText(supplier?.packageWidthMm),
        packageHeightMm: decimalToText(supplier?.packageHeightMm),
        packageWeightKg: decimalToText(supplier?.packageWeightKg),
        minLeadTimeDays: supplier?.minLeadTimeDays != null ? String(supplier.minLeadTimeDays) : "",
        supplierNote: supplier?.supplierNote ?? "",
    }))

    const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }))

    const handleSubmit = () => {
        onSubmit({
            price: parseOptionalNumber(form.price),
            supplierVariantCode: form.supplierVariantCode,
            supplierNote: form.supplierNote,
            hasSupplierLogo: form.hasSupplierLogo,
            minOrderQty: parseOptionalInteger(form.minOrderQty),
            unitsPerPackage: parseOptionalInteger(form.unitsPerPackage),
            packageLengthMm: parseOptionalNumber(form.packageLengthMm),
            packageWidthMm: parseOptionalNumber(form.packageWidthMm),
            packageHeightMm: parseOptionalNumber(form.packageHeightMm),
            packageWeightKg: parseOptionalNumber(form.packageWeightKg),
            minLeadTimeDays: parseOptionalInteger(form.minLeadTimeDays),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tedarikçi satırını düzenle</DialogTitle>
                    <DialogDescription>
                        <span className="font-medium">{supplierName}</span>
                        {supplier?.fullCode ? (
                            <span className="ml-2 font-mono text-xs">{supplier.fullCode}</span>
                        ) : null}
                        <span className="mt-1 block">
                            Ölçü, renk/hammadde ve tedarikçi değiştirilemez — bunlar varyantın kodunu
                            belirler. Değiştirmeniz gerekiyorsa satırı silip yeniden girin.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Alış fiyatı</Label>
                        <Input value={form.price} inputMode="decimal" onChange={(e) => set({ price: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Tedarikçi kodu</Label>
                        <Input
                            value={form.supplierVariantCode}
                            placeholder="AS231"
                            onChange={(e) => set({ supplierVariantCode: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col justify-end gap-2 pb-1">
                        <Label className="text-xs">Tedarikçi logosu</Label>
                        <Checkbox
                            checked={form.hasSupplierLogo}
                            onCheckedChange={(checked) => set({ hasSupplierLogo: checked === true })}
                            aria-label="Ürün üzerinde tedarikçi logosu var"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Min. sipariş</Label>
                        <Input value={form.minOrderQty} inputMode="numeric" onChange={(e) => set({ minOrderQty: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Kolideki adet</Label>
                        <Input value={form.unitsPerPackage} inputMode="numeric" onChange={(e) => set({ unitsPerPackage: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Termin (gün)</Label>
                        <Input value={form.minLeadTimeDays} inputMode="numeric" onChange={(e) => set({ minLeadTimeDays: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Koli boy (mm)</Label>
                        <Input value={form.packageLengthMm} inputMode="decimal" onChange={(e) => set({ packageLengthMm: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Koli en (mm)</Label>
                        <Input value={form.packageWidthMm} inputMode="decimal" onChange={(e) => set({ packageWidthMm: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Koli yükseklik (mm)</Label>
                        <Input value={form.packageHeightMm} inputMode="decimal" onChange={(e) => set({ packageHeightMm: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Koli ağırlık (kg)</Label>
                        <Input value={form.packageWeightKg} inputMode="decimal" onChange={(e) => set({ packageWeightKg: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1 md:col-span-3">
                        <Label className="text-xs">Not</Label>
                        <Input value={form.supplierNote} onChange={(e) => set({ supplierNote: e.target.value })} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
