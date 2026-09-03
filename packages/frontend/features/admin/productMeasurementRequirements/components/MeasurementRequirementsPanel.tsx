"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Pencil, Ruler } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { MeasurementRequirementsEditorDialog } from "@/features/admin/productMeasurementRequirements/components/MeasurementRequirementsEditorDialog"
import { useMeasurementRequirements } from "@/features/admin/productMeasurementRequirements/hooks/useMeasurementRequirements"
import { useVariantMatrixReferences } from "@/features/admin/productVariantMatrix/hooks/useVariantMatrixReferences"

type Props = {
    productId: string
    productName: string
    /** Uyarıda kaç ölçünün etkileneceğini söylemek için. */
    sizeCount: number
    /** Şablonu düzenlerken referans için diyalogda gösterilen teknik resim. */
    technicalDrawingUrl?: string | null
}

/**
 * Ölçü şablonunun sol sütundaki OKUMA görünümü.
 *
 * Şablon varyant tablosunun kolonlarını belirlediği için burada — operatör satır
 * girerken hangi ölçüyü neden girdiğini görebilmeli. Düzenleme diyalogda yapılır:
 * sütun 304px ve satır başına dört alan + sıralama düğmeleri buraya sığmıyor.
 */
export function MeasurementRequirementsPanel({ productId, productName, sizeCount, technicalDrawingUrl }: Props) {
    const { data: requirements, isLoading } = useMeasurementRequirements(productId)
    const { data: references, isLoading: referencesLoading, isError: referencesError } = useVariantMatrixReferences()
    const [editorOpen, setEditorOpen] = useState(false)

    const measurementTypes = references?.measurementTypes ?? []

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

    const canEdit = measurementTypes.length > 0

    return (
        <>
            <PanelShell
                action={
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-neutral-500"
                        disabled={!canEdit}
                        title={canEdit ? undefined : "Sistemde hiç ölçü tipi tanımlı değil"}
                        onClick={() => setEditorOpen(true)}
                    >
                        <Pencil className="size-3" />
                        düzenle
                    </Button>
                }
            >
                {!canEdit ? (
                    <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed dark:border-amber-800 dark:bg-amber-950/30">
                        Sistemde hiç ölçü tipi tanımlı değil. Önce <span className="font-medium">Ölçü Tipleri</span>{" "}
                        sayfasından (ör. Uzunluk, Çap) tanımlayın.
                    </p>
                ) : requirements.length === 0 ? (
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

            <MeasurementRequirementsEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                productId={productId}
                productName={productName}
                requirements={requirements}
                measurementTypes={measurementTypes}
                sizeCount={sizeCount}
                technicalDrawingUrl={technicalDrawingUrl}
            />
        </>
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
