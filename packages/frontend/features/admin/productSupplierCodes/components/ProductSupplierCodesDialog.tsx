"use client"

import { useRef, useState } from "react"
import { Check, FileUp, Info, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react"

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"
import {
    useCreateProductSupplierCode,
    useDeleteProductSupplierCode,
    usePendingSupplierCodeDrawingReconciler,
    useProductSupplierCodes,
    useUpdateProductSupplierCode,
    useUploadProductSupplierCodeDrawing,
} from "@/features/admin/productSupplierCodes/hooks/useProductSupplierCodes"
import { SupplierCodeDrawingCell } from "@/features/admin/productSupplierCodes/components/SupplierCodeDrawingCell"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productCode: string
    productName: string
    canDelete?: boolean
}

/**
 * Ürün modelinin tedarikçi harfi sözlüğü — kodun 5. segmenti ("A").
 *
 * Harf ÜRÜN MODELİNE ÖZELDİR: `1.2.3.V1.A` Özgen iken `10.11.2.V1.A` Aparat
 * Toptan olabilir. Versiyon sözlüğüyle aynı desende: HARF sabittir (değiştirmek
 * o tedarikçinin tüm varyant kodlarını yeniden yazmayı gerektirir), TEDARİKÇİ
 * ataması düzenlenebilir.
 */
export function ProductSupplierCodesDialog({
    open,
    onOpenChange,
    productId,
    productCode,
    productName,
    canDelete = false,
}: Props) {
    const { data: codes, isLoading, isError } = useProductSupplierCodes(productId)
    const { data: references } = useVariantMatrixReferences()
    const createMutation = useCreateProductSupplierCode(productId)
    const updateMutation = useUpdateProductSupplierCode(productId)
    const deleteMutation = useDeleteProductSupplierCode(productId)
    const uploadDrawingMutation = useUploadProductSupplierCodeDrawing(productId)

    const [supplierId, setSupplierId] = useState("")
    const [code, setCode] = useState("")
    const [editing, setEditing] = useState<{ id: string; supplierId: string } | null>(null)
    const [newDrawing, setNewDrawing] = useState<File | null>(null)
    const newDrawingInputRef = useRef<HTMLInputElement>(null)

    // Bir harfin teknik resmi PENDING iken listeyi tazeler (S3 onayına kadar).
    usePendingSupplierCodeDrawingReconciler(codes, productId)

    const suppliers = references?.suppliers ?? []

    const handleCreate = async () => {
        if (!supplierId) return
        const created = await createMutation.mutateAsync({
            supplierId,
            code: code.trim() ? code.trim().toUpperCase() : undefined,
        })
        if (newDrawing) {
            await uploadDrawingMutation.mutateAsync({ codeId: created.id, file: newDrawing })
        }
        setSupplierId("")
        setCode("")
        setNewDrawing(null)
        if (newDrawingInputRef.current) newDrawingInputRef.current.value = ""
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Tedarikçi sözlüğü — {productCode}</DialogTitle>
                    <DialogDescription>
                        {productName} için tedarikçinin varyant kodundaki harfi
                        (<span className="font-mono">{productCode}.2.V1.<b>A</b></span>).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed dark:border-amber-800 dark:bg-amber-950/30">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-medium">Harf bu ürüne özeldir ve sonradan değiştirilemez.</p>
                        <p>
                            Aynı harf başka bir ürün modelinde başka bir firmayı gösterebilir.
                            <b> Harf</b> verildikten sonra sabittir — değiştirmek, o tedarikçinin bu
                            üründeki tüm varyant kodlarını yeniden yazmak demek olurdu.
                            <b> Tedarikçi ataması</b> ise düzenlenebilir: kodda firma kimliği geçmez,
                            yalnız harf geçer. Kullanımdaki bir harfi düzenlerseniz o harfin ANLAMI
                            değişir.
                        </p>
                    </div>
                </div>

                <section className="space-y-3 rounded-lg border p-4">
                    <h3 className="text-sm font-medium">Yeni tedarikçi harfi</h3>
                    <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
                        <div className="space-y-1">
                            <Label className="text-xs">Tedarikçi</Label>
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Harf</Label>
                            <Input
                                value={code}
                                placeholder="otomatik"
                                maxLength={3}
                                onChange={(event) => setCode(event.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                type="button"
                                onClick={handleCreate}
                                disabled={!supplierId || createMutation.isPending || uploadDrawingMutation.isPending}
                            >
                                {createMutation.isPending || uploadDrawingMutation.isPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 size-4" />
                                )}
                                Ekle
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={newDrawingInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(event) => setNewDrawing(event.target.files?.[0] ?? null)}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => newDrawingInputRef.current?.click()}
                        >
                            <FileUp className="mr-1 size-3" />
                            {newDrawing ? "Teknik resmi değiştir" : "Teknik resim ekle (opsiyonel)"}
                        </Button>
                        {newDrawing ? (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                                {newDrawing.name}
                                <button
                                    type="button"
                                    aria-label="Seçili teknik resmi kaldır"
                                    onClick={() => {
                                        setNewDrawing(null)
                                        if (newDrawingInputRef.current) newDrawingInputRef.current.value = ""
                                    }}
                                >
                                    <X className="size-3" />
                                </button>
                            </span>
                        ) : null}
                    </div>

                    <p className="text-xs text-neutral-500">
                        Harf boş bırakılırsa bu ürün içindeki sıradaki harf verilir (A, B, C…).
                        Teknik resim sonradan da eklenebilir.
                    </p>
                </section>

                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : isError || !codes ? (
                    <div className="text-sm text-red-600">Tedarikçi sözlüğü yüklenemedi.</div>
                ) : codes.length === 0 ? (
                    <p className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                        Bu ürün modelinde henüz tedarikçi harfi yok. Veri girişine başlamadan
                        tanımlayabilirsiniz — tanımlamazsanız ilk kullanımda sırayla verilir.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Harf</TableHead>
                                    <TableHead>Tedarikçi</TableHead>
                                    <TableHead>Kullanım</TableHead>
                                    <TableHead>Teknik resim</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.map((entry) => {
                                    const inUse = entry.usageCount > 0
                                    const isEditing = editing?.id === entry.id

                                    return (
                                        <TableRow key={entry.id} className={isEditing ? "bg-neutral-50 dark:bg-neutral-900/40" : undefined}>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">{entry.code}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select
                                                        value={editing.supplierId}
                                                        onValueChange={(value) => setEditing({ ...editing, supplierId: value })}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {suppliers.map((supplier) => (
                                                                <SelectItem key={supplier.id} value={supplier.id}>
                                                                    {supplier.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-sm">{entry.supplier.name}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {inUse ? (
                                                    <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                                        <Lock className="size-3.5" />
                                                        {entry.usageCount} satır
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">kullanılmıyor</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <SupplierCodeDrawingCell productId={productId} entry={entry} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                type="button" size="icon" variant="ghost" className="size-8"
                                                                aria-label="Vazgeç"
                                                                onClick={() => setEditing(null)}
                                                                disabled={updateMutation.isPending}
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button" size="icon" variant="ghost" className="size-8"
                                                                aria-label="Kaydet"
                                                                disabled={updateMutation.isPending || !editing.supplierId}
                                                                onClick={async () => {
                                                                    await updateMutation.mutateAsync({
                                                                        codeId: entry.id,
                                                                        supplierId: editing.supplierId,
                                                                    })
                                                                    setEditing(null)
                                                                }}
                                                            >
                                                                {updateMutation.isPending ? (
                                                                    <Loader2 className="size-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="size-4 text-green-600" />
                                                                )}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                type="button" size="icon" variant="ghost" className="size-8"
                                                                aria-label="Düzenle"
                                                                title="Tedarikçiyi değiştir (harf sabit kalır)"
                                                                onClick={() => setEditing({ id: entry.id, supplierId: entry.supplierId })}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            {canDelete ? (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            type="button" size="icon" variant="ghost" className="size-8"
                                                                            aria-label="Sil"
                                                                            disabled={inUse || deleteMutation.isPending}
                                                                            title={inUse ? "Varyantlarda kullanılıyor, silinemez" : "Sil"}
                                                                        >
                                                                            <Trash2 className="size-4 text-red-600" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>{entry.code} silinsin mi?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Bu harf hiçbir varyant satırında kullanılmıyor.
                                                                                Silinen harf YENİDEN KULLANILMAZ — sonraki tedarikçi
                                                                                sıradaki harfi alır, yani sözlükte boşluk kalır.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => deleteMutation.mutate(entry.id)}>
                                                                                Sil
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
