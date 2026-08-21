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

import {
    useMeasurementRequirements,
    useReplaceMeasurementRequirements,
} from "@/features/admin/productMeasurementRequirements/hooks/useMeasurementRequirements"
import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"
import type { MeasurementRequirement } from "@/features/admin/productMeasurementRequirements/api/types"

type MeasurementTypeOption = {
    id: string
    code: string
    name: string
    baseUnit: string
}

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
}

type FormProps = {
    productId: string
    measurementTypes: MeasurementTypeOption[]
    initialRequirements: MeasurementRequirement[]
    onClose: () => void
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

/**
 * Ürün modeline özel ölçü şablonu.
 *
 * Listedeki SIRA doğrudan ölçü KODUNU etkiler: çok ölçülü modellerde ("M4 + 10 cm")
 * sıralama önce birinci ölçüye, eşitse ikinciye bakar. Bu yüzden satırlar taşınabilir
 * ve sıra `sortPriority` olarak gönderilir.
 */
/**
 * Form gövdesi AYRI bir bileşen: taslakları prop'tan `useState` başlangıç değeri
 * olarak alır. Böylece "veri gelince state'i senkronla" effect'ine hiç gerek kalmaz
 * (effect içinde senkron setState kaskad render tetikliyordu). Dış bileşen veri
 * hazır olana kadar bunu MOUNT ETMEZ.
 */
function MeasurementRequirementsForm({
    productId,
    measurementTypes,
    initialRequirements,
    onClose,
}: FormProps) {
    const replaceMutation = useReplaceMeasurementRequirements(productId)

    const [drafts, setDrafts] = useState<DraftRequirement[]>(() => initialRequirements.map(toDraft))

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

    const addRow = () => {
        setDrafts((current) => [
            ...current,
            { measurementTypeId: "", label: "", unit: "", isRequired: true },
        ])
    }

    /**
     * Mevcut bir ölçü tipini tek tıkla ekler; ad ve birim tipin kendisinden
     * doldurulur (ürün modeline özel bir ad gerekiyorsa üzerine yazılabilir).
     * Boş satır açıp açılır listeden seçmek fazladan iki adımdı ve tanımlı ölçü
     * tiplerinin varlığı ekranda hiç görünmüyordu.
     */
    const addFromType = (type: MeasurementTypeOption) => {
        setDrafts((current) => [
            ...current,
            { measurementTypeId: type.id, label: type.name, unit: type.baseUnit, isRequired: true },
        ])
    }

    const usedTypeIds = new Set(drafts.map((draft) => draft.measurementTypeId))
    const quickAddTypes = measurementTypes.filter((type) => !usedTypeIds.has(type.id))

    const usedTypeAndLabel = new Set(
        drafts.map((draft) => `${draft.measurementTypeId}#${draft.label.trim().toLowerCase()}`),
    )
    const hasDuplicate = usedTypeAndLabel.size !== drafts.length
    const hasIncomplete = drafts.some((draft) => !draft.measurementTypeId || !draft.label.trim())

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
        onClose()
    }

    return (
        <>
                    <div className="space-y-3">
                        {drafts.length === 0 ? (
                            <p className="rounded-md border border-dashed p-6 text-center text-sm text-neutral-500">
                                Henüz ölçü tanımlanmamış. Varyant girebilmek için en az bir ölçü ekleyin.
                            </p>
                        ) : null}

                        {drafts.map((draft, index) => (
                            <div
                                key={draft.id ?? `draft-${index}`}
                                className="grid grid-cols-12 items-end gap-2 rounded-md border p-3"
                            >
                                <div className="col-span-1 flex flex-col items-center gap-1">
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

                                <div className="col-span-1 flex flex-col items-center gap-1">
                                    <Label className="text-xs">Zorunlu</Label>
                                    <Checkbox
                                        checked={draft.isRequired}
                                        onCheckedChange={(checked) =>
                                            updateDraft(index, { isRequired: checked === true })
                                        }
                                    />
                                </div>

                                <div className="col-span-2 flex justify-end gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                        aria-label="Yukarı taşı"
                                    >
                                        <ArrowUp className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={index === drafts.length - 1}
                                        onClick={() => move(index, 1)}
                                        aria-label="Aşağı taşı"
                                    >
                                        <ArrowDown className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}
                                        aria-label="Sil"
                                    >
                                        <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {quickAddTypes.length > 0 ? (
                            <div className="space-y-2 rounded-md border bg-neutral-50/70 p-3 dark:bg-neutral-900/40">
                                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                    Tanımlı ölçü tiplerinden ekle
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {quickAddTypes.map((type) => (
                                        <Button
                                            key={type.id}
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addFromType(type)}
                                        >
                                            <Plus className="mr-1 size-3.5" />
                                            <span className="font-mono text-xs">{type.code}</span>
                                            <span className="ml-1">{type.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <Button type="button" variant="outline" onClick={addRow} className="w-full">
                            <Plus className="mr-2 size-4" />
                            Boş satır ekle
                        </Button>

                        {hasDuplicate ? (
                            <p className="text-sm text-red-600">
                                Aynı ölçü tipi ve adı birden fazla kez tanımlanamaz.
                            </p>
                        ) : null}
                    </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>
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

export function MeasurementRequirementsDialog({
    open,
    onOpenChange,
    productId,
    productName,
}: Props) {
    const { data: requirements, isLoading } = useMeasurementRequirements(productId)
    const {
        data: references,
        isLoading: referencesLoading,
        isError: referencesError,
    } = useVariantMatrixReferences()

    const measurementTypes = references?.measurementTypes ?? []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ruler className="size-4" />
                        Ölçü Şablonu
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium">{productName}</span> modelinde hangi ölçülerin
                        girileceğini belirler. Listedeki sıra ölçü kodunun sıralamasını da belirler:
                        en üstteki ölçü baskındır.
                        <span className="mt-2 block">
                            <span className="font-medium">Bu modeldeki adı</span> alanını bu ürüne göre
                            değiştirebilirsiniz — aynı <span className="font-mono">R</span> kodu bir modelde
                            &quot;Elcik Çapı&quot;, başka modelde &quot;Kol Çapı&quot; olabilir.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {referencesError ? (
                    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-medium">Ölçü tipleri yüklenemedi.</p>
                            <p>
                                Şablon düzenlenemiyor çünkü seçilebilecek ölçü tipleri alınamadı.
                                Sayfayı yenileyin; sorun sürerse yetkiniz veya bağlantınız kontrol edilmeli.
                            </p>
                        </div>
                    </div>
                ) : isLoading || referencesLoading || !requirements ? (
                    <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
                        <Loader2 className="size-4 animate-spin" />
                        Şablon ve ölçü tipleri yükleniyor…
                    </div>
                ) : measurementTypes.length === 0 ? (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                        Sistemde hiç ölçü tipi tanımlı değil. Önce
                        <span className="font-medium"> Ölçü Tipleri </span>
                        sayfasından (ör. Uzunluk, Çap) tanımlayın.
                    </div>
                ) : (
                    <MeasurementRequirementsForm
                        // Veri değişince form taze başlangıç değeriyle yeniden kurulur.
                        key={requirements.map((requirement) => requirement.id).join("|")}
                        productId={productId}
                        measurementTypes={measurementTypes}
                        initialRequirements={requirements}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
