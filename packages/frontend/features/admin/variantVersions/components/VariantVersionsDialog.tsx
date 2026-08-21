"use client"

import { useState } from "react"
import { Info, Loader2, Lock, Plus, Trash2 } from "lucide-react"

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { MaterialMultiSelect } from "@/features/admin/productVariantMatrix/components/MaterialMultiSelect"
import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"
import {
    useCreateVariantVersion,
    useDeleteVariantVersion,
    useVariantVersions,
} from "@/features/admin/variantVersions/hooks/useVariantVersions"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productCode: string
    productName: string
    /** Silme yalnız yöneticide; veri girişi operatörü tanımlar, silemez. */
    canDelete?: boolean
}

/**
 * Ürün modelinin versiyon sözlüğü — renk + hammadde kombinasyonunun "V1" numarası.
 *
 * Her ürün modelinin kendi listesi vardır; numara APPEND-ONLY'dur. Mevcut bir kaydın
 * numarası değiştirilemez, çünkü o kombinasyonu kullanan tüm varyantların kodunu
 * yeniden yazmak gerekirdi. Varyant girişi tanımsız kombinasyonu REDDEDER — bu yüzden
 * düzen veri girişine başlamadan burada kurulur.
 *
 * Ölçü şablonu diyaloğuyla aynı desendedir: yüzey ürünün varyant ekranından açılır,
 * çünkü ikisi de o ürün modeline ait ve giriş yapmadan önce tanımlanması gerekiyor.
 */
export function VariantVersionsDialog({
    open,
    onOpenChange,
    productId,
    productCode,
    productName,
    canDelete = false,
}: Props) {
    const { data, isLoading, isError } = useVariantVersions(productId)
    const { data: references } = useVariantMatrixReferences()
    const createMutation = useCreateVariantVersion(productId)
    const deleteMutation = useDeleteVariantVersion(productId)

    const [colorId, setColorId] = useState("")
    const [materialIds, setMaterialIds] = useState<string[]>([])
    const [code, setCode] = useState("")

    const colors = references?.colors ?? []
    const materials = references?.materials ?? []

    const canSubmit = Boolean(colorId) || materialIds.length > 0

    const handleCreate = async () => {
        if (!canSubmit) return
        const parsedCode = code.trim() ? Number(code.trim()) : undefined

        await createMutation.mutateAsync({
            colorId: colorId || undefined,
            materialIds: materialIds.length > 0 ? materialIds : undefined,
            code: Number.isFinite(parsedCode) ? parsedCode : undefined,
        })

        setColorId("")
        setMaterialIds([])
        setCode("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Versiyon sözlüğü — {productCode}</DialogTitle>
                    <DialogDescription>
                        {productName} için renk + hammadde kombinasyonunun varyant kodundaki numarası
                        (<span className="font-mono">{productCode}.8.<b>V1</b></span>).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed dark:border-amber-800 dark:bg-amber-950/30">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <p className="font-medium">Önce tanımlayın, numara sonradan değiştirilemez.</p>
                        <p>
                            Varyant girişinde burada tanımlı olmayan bir kombinasyon kullanılamaz.
                            Numara verildikten sonra sabittir — değiştirmek, o kombinasyonu kullanan
                            tüm varyantların kodunu yeniden yazmak demek olurdu. İstediğiniz düzeni
                            (ör. <span className="font-mono">Siyah + Bakalit = V1</span>) giriş
                            yapmadan önce kurun.
                        </p>
                    </div>
                </div>

                <section className="space-y-3 rounded-lg border p-4">
                    <h3 className="text-sm font-medium">Yeni kombinasyon</h3>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px_auto]">
                        <div className="space-y-1">
                            <Label className="text-xs">Renk</Label>
                            <Select
                                value={colorId || "none"}
                                onValueChange={(value) => setColorId(value === "none" ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Renksiz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Renksiz</SelectItem>
                                    {colors.map((color) => (
                                        <SelectItem key={color.id} value={color.id}>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="size-3 rounded-full border"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                {color.code} — {color.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Hammadde</Label>
                            <MaterialMultiSelect materials={materials} value={materialIds} onChange={setMaterialIds} />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Numara</Label>
                            <Input
                                value={code}
                                inputMode="numeric"
                                placeholder={data ? `V${data.nextCode}` : "otomatik"}
                                onChange={(event) => setCode(event.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button type="button" onClick={handleCreate} disabled={!canSubmit || createMutation.isPending}>
                                {createMutation.isPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 size-4" />
                                )}
                                Ekle
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-neutral-500">
                        Numara boş bırakılırsa bu ürün içindeki sıradaki boş numara verilir.
                        En az bir renk veya hammadde seçilmeli.
                    </p>
                </section>

                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : isError || !data ? (
                    <div className="text-sm text-red-600">Versiyon sözlüğü yüklenemedi.</div>
                ) : data.versions.length === 0 ? (
                    <p className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                        Bu ürün modelinde henüz versiyon tanımlı değil. İlk kombinasyonu ekleyerek
                        başlayın — ilk eklenen <span className="font-mono">V1</span> olur.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Kod</TableHead>
                                    <TableHead>Renk</TableHead>
                                    <TableHead>Hammadde</TableHead>
                                    <TableHead>Kullanım</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.versions.map((version) => {
                                    const inUse = version.variantCount > 0

                                    return (
                                        <TableRow key={version.id}>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    V{version.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {version.color ? (
                                                    <span className="flex items-center gap-2 text-sm">
                                                        <span
                                                            className="size-3 shrink-0 rounded-full border"
                                                            style={{ backgroundColor: version.color.hex }}
                                                        />
                                                        {version.color.code} — {version.color.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">Renksiz</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {version.materials.map((m) => m.code ?? m.name).join(", ") || (
                                                    <span className="text-neutral-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {inUse ? (
                                                    <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                                        <Lock className="size-3.5" />
                                                        {version.variantCount} varyant
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">kullanılmıyor</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canDelete ? (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-8"
                                                                aria-label="Sil"
                                                                disabled={inUse || deleteMutation.isPending}
                                                                title={inUse ? "Varyantlarda kullanılıyor, silinemez" : "Sil"}
                                                            >
                                                                <Trash2 className="size-4 text-red-600" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>V{version.code} silinsin mi?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Bu kombinasyon hiçbir varyantta kullanılmıyor.
                                                                    Silinen numara YENİDEN KULLANILMAZ — sonraki
                                                                    kombinasyon sıradaki numarayı alır, yani sözlükte
                                                                    boşluk kalır.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => deleteMutation.mutate(version.id)}>
                                                                    Sil
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                ) : null}
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
