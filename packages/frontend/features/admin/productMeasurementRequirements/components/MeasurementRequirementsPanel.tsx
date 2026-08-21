"use client"

import { useState } from "react"
import { AlertTriangle, ArrowDown, ArrowUp, Loader2, Plus, Ruler, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
    useMeasurementRequirements,
    useReplaceMeasurementRequirements,
} from "@/features/admin/productMeasurementRequirements/hooks/useMeasurementRequirements"
import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"
import type { MeasurementRequirement } from "@/features/admin/productMeasurementRequirements/api/types"

type MeasurementTypeOption = { id: string; code: string; name: string; baseUnit: string }

type DraftRequirement = {
    id?: string
    measurementTypeId: string
    label: string
    unit: string
    isRequired: boolean
}

type Props = {
    productId: string
    /** Taslak modda sıra değişikliği mevcut kodları yeniden numaralar. */
    isDraftMode: boolean
    /** Uyarıda kaç ölçünün etkileneceğini söylemek için. */
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

function sameOrder(a: DraftRequirement[], b: MeasurementRequirement[]) {
    if (a.length !== b.length) return false
    return a.every((draft, index) => draft.id === b[index]?.id)
}

/**
 * Ölçü şablonu — sayfanın sol sütununda, YERİNDE.
 *
 * Diyalog değil: şablon varyant tablosunun kolonlarını belirliyor, operatör satır
 * girerken hangi ölçüyü neden girdiğini görebilmeli. Okuma modu dar ve sessiz;
 * düzenleme modu yalnız gerektiğinde açılır.
 */
export function MeasurementRequirementsPanel({ productId, isDraftMode, sizeCount }: Props) {
    const { data: requirements, isLoading } = useMeasurementRequirements(productId)
    const { data: references, isLoading: referencesLoading, isError: referencesError } = useVariantMatrixReferences()
    const replaceMutation = useReplaceMeasurementRequirements(productId)

    const [drafts, setDrafts] = useState<DraftRequirement[] | null>(null)
    const measurementTypes: MeasurementTypeOption[] = references?.measurementTypes ?? []
    const isEditing = drafts !== null

    if (referencesError) {
        return (
            <PanelShell>
                <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    Ölçü tipleri yüklenemedi; şablon düzenlenemiyor.
                </div>
            </PanelShell>
        )
    }

    if (isLoading || referencesLoading || !requirements) {
        return (
            <PanelShell>
                <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                    <Loader2 className="size-3.5 animate-spin" />
                    Yükleniyor…
                </div>
            </PanelShell>
        )
    }

    // ── Okuma modu ──────────────────────────────────────────────────────────────
    if (!isEditing) {
        return (
            <PanelShell
                action={
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-neutral-500"
                        onClick={() => setDrafts(requirements.map(toDraft))}
                    >
                        düzenle
                    </Button>
                }
            >
                {requirements.length === 0 ? (
                    <p className="rounded-md border border-dashed p-3 text-xs text-neutral-500">
                        Ölçü tanımlanmamış. Varyant girebilmek için en az bir ölçü ekleyin.
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col gap-1.5">
                            {requirements.map((requirement, index) => (
                                <div
                                    key={requirement.id}
                                    className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-2 dark:bg-neutral-950"
                                >
                                    <Badge variant="secondary" className="font-mono text-[10px]">{index + 1}</Badge>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{requirement.label}</div>
                                        <div className="font-mono text-[11px] text-neutral-500">
                                            {requirement.measurementType.code}
                                            {requirement.unit ? ` · ${requirement.unit}` : ""}
                                            {requirement.isRequired ? "" : " · opsiyonel"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                            Sıra ölçü kodunu belirler: en üstteki ölçü baskındır.
                        </p>
                    </>
                )}
            </PanelShell>
        )
    }

    // ── Düzenleme modu ──────────────────────────────────────────────────────────
    const updateDraft = (index: number, patch: Partial<DraftRequirement>) => {
        setDrafts((current) => current?.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)) ?? null)
    }

    const move = (index: number, direction: -1 | 1) => {
        setDrafts((current) => {
            if (!current) return current
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

    // Sıra değişmişse ve ürün taslak moddaysa mevcut kodlar yeniden numaralanır.
    const willRenumber = isDraftMode && sizeCount > 0 && !sameOrder(drafts, requirements)

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
        setDrafts(null)
    }

    return (
        <PanelShell
            action={
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setDrafts(null)}
                    >
                        Vazgeç
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="h-6 px-2.5 text-xs"
                        disabled={hasDuplicate || hasIncomplete || replaceMutation.isPending}
                        onClick={handleSave}
                    >
                        {replaceMutation.isPending ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                        Kaydet
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-2">
                {drafts.map((draft, index) => {
                    const inUse = Boolean(draft.id) && sizeCount > 0

                    return (
                        <div key={draft.id ?? `draft-${index}`} className="space-y-1.5 rounded-md border bg-white p-2 dark:bg-neutral-950">
                            <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="font-mono text-[10px]">{index + 1}</Badge>
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
                                    <SelectTrigger className="h-8 w-full text-xs">
                                        <SelectValue placeholder="Ölçü tipi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {measurementTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.code} — {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button" size="icon" variant="ghost" className="size-7 shrink-0"
                                    disabled={inUse}
                                    title={inUse ? "Varyantlarda kullanılıyor, çıkarılamaz" : "Sil"}
                                    aria-label="Ölçüyü çıkar"
                                    onClick={() => setDrafts((current) => current?.filter((_, i) => i !== index) ?? null)}
                                >
                                    <Trash2 className="size-3.5 text-red-600" />
                                </Button>
                            </div>

                            <Input
                                value={draft.label}
                                placeholder="Ör. Burç Metriği"
                                className="h-8 text-xs"
                                onChange={(event) => updateDraft(index, { label: event.target.value })}
                            />

                            <div className="flex items-center gap-2">
                                <Input
                                    value={draft.unit}
                                    placeholder="birim"
                                    className="h-8 w-20 text-xs"
                                    onChange={(event) => updateDraft(index, { unit: event.target.value })}
                                />
                                <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                                    <Checkbox
                                        checked={draft.isRequired}
                                        onCheckedChange={(checked) => updateDraft(index, { isRequired: checked === true })}
                                    />
                                    Zorunlu
                                </label>
                                <div className="ml-auto flex gap-0.5">
                                    <Button type="button" size="icon" variant="ghost" className="size-7"
                                        disabled={index === 0} onClick={() => move(index, -1)} aria-label="Yukarı taşı">
                                        <ArrowUp className="size-3.5" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" className="size-7"
                                        disabled={index === drafts.length - 1} onClick={() => move(index, 1)} aria-label="Aşağı taşı">
                                        <ArrowDown className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {quickAdd.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                    <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        Tanımlı ölçü tiplerinden ekle
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {quickAdd.map((type) => (
                            <Button
                                key={type.id} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
                                onClick={() => setDrafts((current) => [
                                    ...(current ?? []),
                                    { measurementTypeId: type.id, label: type.name, unit: type.baseUnit, isRequired: true },
                                ])}
                            >
                                <Plus className="mr-1 size-3" />
                                <span className="font-mono">{type.code}</span>
                                <span className="ml-1">{type.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}

            {hasDuplicate ? (
                <p className="mt-2 text-[11px] text-red-600">Aynı ölçü tipi ve adı iki kez tanımlanamaz.</p>
            ) : null}

            {willRenumber ? (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-[11px] leading-relaxed dark:border-amber-800 dark:bg-amber-950/30">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                        Sıra değişti. Ürün taslak modda olduğu için kaydedince{" "}
                        <b>{sizeCount} ölçü yeniden numaralanacak</b> — mevcut varyant kodları değişir.
                    </span>
                </div>
            ) : null}
        </PanelShell>
    )
}

function PanelShell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Ruler className="size-3.5" />
                    Ölçü şablonu
                </h2>
                {action}
            </div>
            {children}
        </section>
    )
}
