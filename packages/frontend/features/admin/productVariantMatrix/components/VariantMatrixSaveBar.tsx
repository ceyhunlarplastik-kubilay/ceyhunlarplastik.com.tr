"use client"

import { AlertTriangle, Loader2, Lock, Plus, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Props = {
    draftCount: number
    readyCount: number
    errorCount: number
    isSaving: boolean
    isLocked: boolean
    /** Kaydedince kaç YENİ ölçü kodu ve tedarikçi harfi oluşacak. */
    newSizeCount: number
    newSupplierCount: number
    onAddRow: () => void
    onClear: () => void
    onSave: () => void
    /** Ekran dışındaki ilk hatalı satıra kaydırır. */
    onFocusFirstError: () => void
}

/**
 * Ekranın altına yapışık kaydet çubuğu.
 *
 * İki sorunu çözer: (1) 20 satır girdikten sonra kaydet düğmesini aramak için
 * kaydırmak gerekiyordu, (2) hatalı satır ekran dışındaysa fark edilmiyordu.
 * Ayrıca kaydetmenin NE üreteceğini önceden söyler — kod oluşumu sürpriz olmasın.
 */
export function VariantMatrixSaveBar({
    draftCount, readyCount, errorCount, isSaving, isLocked,
    newSizeCount, newSupplierCount,
    onAddRow, onClear, onSave, onFocusFirstError,
}: Props) {
    const hasErrors = errorCount > 0

    const effects: string[] = []
    if (newSizeCount > 0) effects.push(`${newSizeCount} yeni ölçü kodu`)
    if (newSupplierCount > 0) effects.push(`${newSupplierCount} yeni tedarikçi harfi`)

    return (
        <div
            className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-white px-5 py-3 shadow-[0_-6px_20px_rgb(0_0_0/0.07)] dark:bg-neutral-950"
            role="status"
            aria-live="polite"
        >
            {draftCount === 0 ? (
                <>
                    <span className="text-sm text-neutral-500">
                        Katalogdan satır ekleyerek başlayın. Kodlar kaydederken otomatik verilir.
                    </span>
                    <Button type="button" variant="outline" onClick={onAddRow}>
                        <Plus className="mr-2 size-4" />
                        Satır ekle
                    </Button>
                </>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span>
                            <b>{readyCount}</b> satır hazır
                        </span>

                        {hasErrors ? (
                            <span className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="size-4" />
                                    {errorCount} satırda eksik var
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs underline underline-offset-2"
                                    onClick={onFocusFirstError}
                                >
                                    hataya git
                                </Button>
                            </span>
                        ) : null}

                        {isLocked ? (
                            <Badge variant="secondary" className="gap-1">
                                <Lock className="size-3" />
                                Kilitli — yeni ölçü sona eklenir
                            </Badge>
                        ) : null}

                        {!hasErrors && effects.length > 0 ? (
                            <span className="text-xs text-neutral-500">{effects.join(" · ")} oluşacak</span>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={onClear} disabled={isSaving}>
                            Taslakları temizle
                        </Button>
                        <Button type="button" onClick={onSave} disabled={hasErrors || readyCount === 0 || isSaving}>
                            {isSaving ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 size-4" />
                            )}
                            {isSaving ? "Kaydediliyor…" : `${readyCount} satırı kaydet`}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
