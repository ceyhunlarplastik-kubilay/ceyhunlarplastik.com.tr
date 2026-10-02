"use client"

import { useId, useMemo, useState } from "react"
import { Copy, Lock } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { MatrixRow, MatrixSize } from "@/features/admin/productVariantMatrix/api/types"
import type { VariantMatrixDraftRow } from "@/features/admin/productVariantMatrix/schema/variantMatrixSchema"
import {
    buildDraftsFromSelection,
    type BulkCopyResult,
    type BulkCopySupplierMode,
} from "@/features/admin/productVariantMatrix/utils/buildDraftsFromSelection"
import { VARIANT_MATRIX_MAX_ROWS_PER_REQUEST } from "@core/helpers/productVariants/variantMatrixLimits"

type VersionOption = { id: string; code: number; label: string; colorHex: string | null }
type SupplierOption = { id: string; name: string; letter?: string | null }

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Seçili kayıtlı satırlar, tablodaki sırayla. */
    selectedRows: MatrixRow[]
    /** Ürünün tüm kayıtlı satırları — "zaten kayıtlı" kontrolü filtreden bağımsız. */
    allRows: MatrixRow[]
    sizes: MatrixSize[]
    versionOptions: VersionOption[]
    supplierOptions: SupplierOption[]
    currentDrafts: VariantMatrixDraftRow[]
    /** Sabitleme tüm taslaklarda geçerli: sabitse kopya da o değeri taşır. */
    pinnedVersionId: string
    pinnedSupplierId: string
    onConfirm: (result: BulkCopyResult) => void
}

const ROW_SUPPLIERS = "__row__"
const NO_SUPPLIER = "__none__"

/**
 * Seçili kayıtlı varyantları taslağa toplu kopyalar — "aynı ölçüleri V2 için de gir".
 * Kural `buildDraftsFromSelection`'da; burada yalnız seçim ve önizleme.
 */
export function VariantMatrixBulkCopyDialog({ open, onOpenChange, ...props }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* İçerik kapanınca ayrılır: her açılışta seçimler sabitlemeden yeniden kurulur. */}
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <BulkCopyForm {...props} onCancel={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}

function BulkCopyForm({
    selectedRows,
    allRows,
    sizes,
    versionOptions,
    supplierOptions,
    currentDrafts,
    pinnedVersionId,
    pinnedSupplierId,
    onConfirm,
    onCancel,
}: Omit<Props, "open" | "onOpenChange"> & { onCancel: () => void }) {
    const fieldId = useId()
    const [targetVersionIds, setTargetVersionIds] = useState<string[]>(() => (pinnedVersionId ? [pinnedVersionId] : []))
    const [supplierValue, setSupplierValue] = useState<string>(() => pinnedSupplierId || ROW_SUPPLIERS)
    const [copyCommercial, setCopyCommercial] = useState(true)

    const sourceVersionIds = useMemo(() => new Set(selectedRows.map((row) => row.versionId)), [selectedRows])
    const listedVersions = pinnedVersionId
        ? versionOptions.filter((version) => version.id === pinnedVersionId)
        : versionOptions

    const result = useMemo(() => {
        const supplierMode: BulkCopySupplierMode =
            supplierValue === ROW_SUPPLIERS
                ? { kind: "rowSuppliers" }
                : supplierValue === NO_SUPPLIER
                    ? { kind: "none" }
                    : { kind: "supplier", supplierId: supplierValue }

        return buildDraftsFromSelection({
            selectedRows,
            allRows,
            sizes,
            currentDrafts,
            options: {
                // Sözlük sırasıyla: V2'nin taslakları V3'ünkülerden önce gelsin.
                targetVersionIds: versionOptions
                    .filter((version) => targetVersionIds.includes(version.id))
                    .map((version) => version.id),
                supplierMode,
                copyCommercial,
            },
        })
    }, [allRows, copyCommercial, currentDrafts, selectedRows, sizes, supplierValue, targetVersionIds, versionOptions])

    const draftTotal = currentDrafts.length + result.drafts.length
    const overLimit = draftTotal > VARIANT_MATRIX_MAX_ROWS_PER_REQUEST
    const skipped = [
        result.skippedExisting > 0 ? `${result.skippedExisting} zaten kayıtlı` : null,
        result.skippedDuplicate > 0 ? `${result.skippedDuplicate} zaten taslakta` : null,
    ].filter(Boolean)

    const toggleVersion = (versionId: string, checked: boolean) => {
        setTargetVersionIds((current) =>
            checked ? [...current.filter((id) => id !== versionId), versionId] : current.filter((id) => id !== versionId),
        )
    }

    return (
        <>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
                <DialogTitle>Seçili {selectedRows.length} varyantı taslağa kopyala</DialogTitle>
                <DialogDescription>
                    Ölçüler aynen kopyalanır; kodlar kaydederken verilir. Taslakları kontrol edip kaydedin.
                </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Hedef versiyon</legend>
                    <p className="text-xs text-neutral-500">
                        Birden çok seçerseniz her versiyon için ayrı kopya açılır.
                    </p>
                    {pinnedVersionId ? (
                        <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                            <Lock className="size-3.5" aria-hidden />
                            Versiyon sabitlenmiş. Başka versiyon için önce sabitlemeyi kaldırın.
                        </p>
                    ) : null}
                    {listedVersions.length === 0 ? (
                        <p className="rounded-md border border-dashed p-3 text-sm text-neutral-500">
                            Versiyon sözlüğü boş. Önce soldaki versiyon sözlüğünden tanımlayın.
                        </p>
                    ) : (
                        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                            {listedVersions.map((version) => {
                                const checkboxId = `${fieldId}-version-${version.id}`
                                const checked = targetVersionIds.includes(version.id)
                                return (
                                    <li key={version.id}>
                                        <label
                                            htmlFor={checkboxId}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900",
                                                checked && "bg-neutral-50 dark:bg-neutral-900",
                                            )}
                                        >
                                            <Checkbox
                                                id={checkboxId}
                                                checked={checked}
                                                disabled={Boolean(pinnedVersionId)}
                                                onCheckedChange={(value) => toggleVersion(version.id, value === true)}
                                            />
                                            {version.colorHex ? (
                                                <span
                                                    className="size-3 shrink-0 rounded-full border"
                                                    style={{ backgroundColor: version.colorHex }}
                                                    aria-hidden
                                                />
                                            ) : null}
                                            <span className="font-mono font-medium">V{version.code}</span>
                                            <span className="min-w-0 truncate text-neutral-500">· {version.label}</span>
                                            {sourceVersionIds.has(version.id) ? (
                                                <span className="ml-auto shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                    seçimde var
                                                </span>
                                            ) : null}
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </fieldset>

                <div className="space-y-1.5">
                    <Label htmlFor={`${fieldId}-supplier`}>Tedarikçi</Label>
                    <Select value={supplierValue} onValueChange={setSupplierValue} disabled={Boolean(pinnedSupplierId)}>
                        <SelectTrigger id={`${fieldId}-supplier`} className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ROW_SUPPLIERS}>Satırdaki tedarikçilerle</SelectItem>
                            {supplierOptions.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.letter ? (
                                        <span className="font-mono font-medium">{supplier.letter} · </span>
                                    ) : null}
                                    {supplier.name}
                                </SelectItem>
                            ))}
                            <SelectItem value={NO_SUPPLIER}>Tedarikçisiz</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500">
                        {pinnedSupplierId
                            ? "Tedarikçi sabitlenmiş; kopyalar bu tedarikçiyle açılır."
                            : "“Satırdaki tedarikçilerle”: her satırın aktif tedarikçileri ayrı taslak olur; pasif bağlantılar taşınmaz."}
                    </p>
                </div>

                <div className="space-y-1">
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id={`${fieldId}-commercial`}
                            checked={copyCommercial}
                            onCheckedChange={(value) => setCopyCommercial(value === true)}
                            className="mt-0.5"
                        />
                        <Label htmlFor={`${fieldId}-commercial`} className="leading-5">
                            Fiyat, MOQ, logo, koli ve termin bilgisini de kopyala
                        </Label>
                    </div>
                    <p className="pl-6 text-xs text-neutral-500">
                        Yalnız aynı tedarikçinin bilgisi taşınır. Tedarikçinin ürün kodu renge / versiyona özel
                        olduğu için kopyalanmaz.
                    </p>
                </div>

                <div
                    className={cn(
                        "rounded-md border px-3 py-2.5 text-sm",
                        overLimit
                            ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                            : "bg-neutral-50 dark:bg-neutral-900/50",
                    )}
                    role="status"
                    aria-live="polite"
                >
                    {targetVersionIds.length === 0 ? (
                        <span className="text-neutral-500">Hedef versiyon seçin.</span>
                    ) : overLimit ? (
                        <span>
                            Taslak sayısı {draftTotal} olur; tek kayıtta en fazla {VARIANT_MATRIX_MAX_ROWS_PER_REQUEST} satır
                            gönderilebilir. Daha az satır ya da versiyon seçin.
                        </span>
                    ) : (
                        <span>
                            <span className="font-medium">{result.drafts.length} taslak</span> oluşacak
                            {skipped.length > 0 ? (
                                <span className="text-neutral-500"> · {skipped.join(", ")} — atlanacak</span>
                            ) : null}
                        </span>
                    )}
                </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    İptal
                </Button>
                <Button
                    type="button"
                    disabled={result.drafts.length === 0 || overLimit}
                    onClick={() => onConfirm(result)}
                >
                    <Copy className="mr-2 size-4" />
                    {result.drafts.length > 0 ? `${result.drafts.length} taslak ekle` : "Taslak ekle"}
                </Button>
            </DialogFooter>
        </>
    )
}
