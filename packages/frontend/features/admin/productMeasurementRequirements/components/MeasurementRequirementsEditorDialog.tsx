"use client"

import { useState } from "react"
import { AlertTriangle, ArrowDown, ArrowUp, Loader2, Plus, Ruler, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useReplaceMeasurementRequirements } from "@/features/admin/productMeasurementRequirements/hooks/useMeasurementRequirements"
import type { MeasurementRequirement } from "@/features/admin/productMeasurementRequirements/api/types"

export type MeasurementTypeOption = { id: string; code: string; name: string; baseUnit: string }

type DraftRequirement = {
    id?: string
    measurementTypeId: string
    label: string
    unit: string
    isRequired: boolean
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productName: string
    requirements: MeasurementRequirement[]
    measurementTypes: MeasurementTypeOption[]
    sizeCount: number
}

function toDraft(requirement: MeasurementRequirement): DraftRequirement {
    return {
        id: requirement.id,
        measurementTypeId: requirement.measurementTypeId,
        label: requirement.label,
        unit: requirement.unit ?? "",
        isRequired: requirement.isRequired,
    }
}

function sameOrder(drafts: DraftRequirement[], saved: MeasurementRequirement[]) {
    if (drafts.length !== saved.length) return false
    return drafts.every((draft, index) => draft.id === saved[index]?.id)
}

/**
 * Ölçü şablonu düzenleme diyalogu.
 *
 * Okuma modu sol sütunda kalır (bkz. MeasurementRequirementsPanel); düzenleme
 * buraya taşındı çünkü sütun 304px ve satır başına dört alan + sıralama düğmeleri
 * oraya sığmıyordu.
 */
export function MeasurementRequirementsEditorDialog(props: Props) {
    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ruler className="size-4" />
                        Ölçü Şablonu
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium">{props.productName}</span> modelinde hangi ölçülerin
                        girileceğini belirler. Listedeki sıra ölçü kodunun sıralamasını da belirler:
                        en üstteki ölçü baskındır.
                        <span className="mt-2 block">
                            <span className="font-medium">Bu modeldeki adı</span> alanını bu ürüne göre
                            değiştirebilirsiniz — aynı <span className="font-mono">R</span> kodu bir modelde
                            &quot;Elcik Çapı&quot;, başka modelde &quot;Kol Çapı&quot; olabilir.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* Diyalog her açılışta taze başlangıç değeriyle kurulur — veri gelince
                    state'i senkronlayan bir effect'e gerek kalmaz. */}
                <EditorForm key={props.requirements.map((r) => r.id).join("|")} {...props} />
            </DialogContent>
        </Dialog>
    )
}

function EditorForm({
    onOpenChange, productId, requirements, measurementTypes, sizeCount,
}: Props) {
    const replaceMutation = useReplaceMeasurementRequirements(productId)
    const [drafts, setDrafts] = useState<DraftRequirement[]>(() => requirements.map(toDraft))

    const updateDraft = (index: number, patch: Partial<DraftRequirement>) => {
        setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)))
    }

    const move = (index: number, direction: -1 | 1) => {
        setDrafts((current) => {
            const target = index + direction
            if (target < 0 || target >= current.length) return current
            const next = [...current]
            const [moved] = next.splice(index, 1)
            next.splice(target, 0, moved)
            return next
        })
    }

    const usedKeys = new Set(drafts.map((d) => `${d.measurementTypeId}#${d.label.trim().toLowerCase()}`))
    const hasDuplicate = usedKeys.size !== drafts.length
    const hasIncomplete = drafts.some((d) => !d.measurementTypeId || !d.label.trim())
    const usedTypeIds = new Set(drafts.map((d) => d.measurementTypeId))
    const quickAdd = measurementTypes.filter((type) => !usedTypeIds.has(type.id))
    // Sıra değişikliği artık KODLARI değiştirmiyor (kodlar append-only), ama
    // `sortKey`'i yeniden üretiyor — yani listelerde ölçülerin GÖRÜNME SIRASI
    // değişir. Kullanıcı bunu bilmeli, ama eskisi gibi "kodlar bozulacak"
    // uyarısı vermek artık yanlış olurdu.
    const willResort = sizeCount > 0 && !sameOrder(drafts, requirements)

    const handleSave = async () => {
        await replaceMutation.mutateAsync(
            drafts.map((draft, index) => ({
                id: draft.id,
                measurementTypeId: draft.measurementTypeId,
                label: draft.label.trim(),
                unit: draft.unit.trim() || undefined,
                isRequired: draft.isRequired,
                sortPriority: index,
                displayOrder: index,
            })),
        )
        onOpenChange(false)
    }

    return (
        <>
            <div className="space-y-3">
                {drafts.length === 0 ? (
                    <p className="rounded-md border border-dashed p-6 text-center text-sm text-neutral-500">
                        Henüz ölçü tanımlanmamış. Varyant girebilmek için en az bir ölçü ekleyin.
                    </p>
                ) : null}

                {drafts.map((draft, index) => {
                    // Kullanımdaki ölçü şablondan çıkarılamaz — sunucu da engelliyor.
                    const inUse = Boolean(draft.id) && sizeCount > 0

                    return (
                        <div
                            key={draft.id ?? `draft-${index}`}
                            className="grid grid-cols-12 items-end gap-2 rounded-md border p-3"
                        >
                            <div className="col-span-1 flex justify-center pb-2">
                                <Badge variant="secondary" className="font-mono">{index + 1}</Badge>
                            </div>

                            <div className="col-span-3 space-y-1">
                                <Label className="text-xs">Ölçü tipi</Label>
                                <Select
                                    value={draft.measurementTypeId}
                                    onValueChange={(value) => {
                                        const type = measurementTypes.find((item) => item.id === value)
                                        updateDraft(index, {
                                            measurementTypeId: value,
                                            label: draft.label || type?.name || "",
                                            unit: draft.unit || type?.baseUnit || "",
                                        })
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {measurementTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.code} — {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-4 space-y-1">
                                <Label className="text-xs">Bu modeldeki adı</Label>
                                <Input
                                    value={draft.label}
                                    placeholder="Ör. Burç Metriği"
                                    onChange={(event) => updateDraft(index, { label: event.target.value })}
                                />
                            </div>

                            <div className="col-span-1 space-y-1">
                                <Label className="text-xs">Birim</Label>
                                <Input
                                    value={draft.unit}
                                    placeholder="cm"
                                    onChange={(event) => updateDraft(index, { unit: event.target.value })}
                                />
                            </div>

                            <div className="col-span-1 flex flex-col items-center gap-1.5 pb-2">
                                <Label className="text-xs">Zorunlu</Label>
                                <Checkbox
                                    checked={draft.isRequired}
                                    onCheckedChange={(checked) => updateDraft(index, { isRequired: checked === true })}
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-0.5 pb-1">
                                <Button
                                    type="button" size="icon" variant="ghost"
                                    disabled={index === 0} onClick={() => move(index, -1)} aria-label="Yukarı taşı"
                                >
                                    <ArrowUp className="size-4" />
                                </Button>
                                <Button
                                    type="button" size="icon" variant="ghost"
                                    disabled={index === drafts.length - 1} onClick={() => move(index, 1)} aria-label="Aşağı taşı"
                                >
                                    <ArrowDown className="size-4" />
                                </Button>
                                <Button
                                    type="button" size="icon" variant="ghost"
                                    disabled={inUse}
                                    title={inUse ? `${sizeCount} ölçü kaydında kullanılıyor, çıkarılamaz` : "Sil"}
                                    aria-label="Ölçüyü çıkar"
                                    onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}
                                >
                                    <Trash2 className="size-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    )
                })}

                {quickAdd.length > 0 ? (
                    <div className="space-y-2 rounded-md border bg-neutral-50/70 p-3 dark:bg-neutral-900/40">
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            Tanımlı ölçü tiplerinden ekle
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickAdd.map((type) => (
                                <Button
                                    key={type.id} type="button" size="sm" variant="outline"
                                    onClick={() => setDrafts((current) => [
                                        ...current,
                                        { measurementTypeId: type.id, label: type.name, unit: type.baseUnit, isRequired: true },
                                    ])}
                                >
                                    <Plus className="mr-1 size-3.5" />
                                    <span className="font-mono text-xs">{type.code}</span>
                                    <span className="ml-1">{type.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}

                <Button
                    type="button" variant="outline" className="w-full"
                    onClick={() => setDrafts((current) => [
                        ...current,
                        { measurementTypeId: "", label: "", unit: "", isRequired: true },
                    ])}
                >
                    <Plus className="mr-2 size-4" />
                    Boş satır ekle
                </Button>

                {hasDuplicate ? (
                    <p className="text-sm text-red-600">Aynı ölçü tipi ve adı birden fazla kez tanımlanamaz.</p>
                ) : null}

                {willResort ? (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>
                            Sıra değişti. Kaydedince <b>{sizeCount} ölçünün listeleme sırası</b> bu
                            yeni önceliğe göre yeniden hesaplanır. <b>Varyant kodları DEĞİŞMEZ</b> —
                            kodlar sıradan bağımsızdır.
                        </span>
                    </div>
                ) : null}
            </div>

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    Vazgeç
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={hasDuplicate || hasIncomplete || replaceMutation.isPending}
                >
                    {replaceMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Kaydet
                </Button>
            </DialogFooter>
        </>
    )
}
