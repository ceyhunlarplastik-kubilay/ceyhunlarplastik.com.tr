"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import { useApplyProductIndustrialUsageFunctions } from "@/features/admin/industrialUsageFunctions/hooks/useIndustrialUsageFunctions"
import {
    buildUsageFunctionImportDiff,
    type UsageFunctionImportDiff,
} from "@/features/admin/industrialUsageFunctions/lib/usageFunctionImportDiff"
import { parseUsageFunctionWorkbook } from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbook"
import { UsageFunctionImportPreview } from "./UsageFunctionImportPreview"

type Props = {
    payload: IndustrialUsageFunctionsPayload
}

type PreviewState = {
    fileName: string
    diff: UsageFunctionImportDiff
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export function UsageFunctionImportCard({ payload }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [preview, setPreview] = useState<PreviewState | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const applyMutation = useApplyProductIndustrialUsageFunctions(payload.product.id)

    const resetInput = () => {
        if (inputRef.current) inputRef.current.value = ""
    }

    const handleFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            toast.error("Yalnızca .xlsx dosyası yükleyebilirsiniz")
            resetInput()
            return
        }

        setIsParsing(true)
        try {
            const buffer = await file.arrayBuffer()
            const parsed = await parseUsageFunctionWorkbook(buffer)
            const diff = buildUsageFunctionImportDiff({ parsed, current: payload })

            setPreview({ fileName: file.name, diff })

            if (diff.errors.length > 0) {
                toast.error(`${diff.errors.length} hata bulundu — aktarım yapılmadı`)
            } else if (diff.changes.length === 0) {
                toast.info("Dosyada aktarılacak değişiklik yok")
            } else {
                toast.success(`${diff.changes.length} değişiklik hazır — kontrol edip onaylayın`)
            }
        } catch (error) {
            console.error("Kullanım fonksiyonu dosyası okunamadı:", error)
            toast.error("Excel dosyası okunamadı. Dosya bozulmuş olabilir.")
            setPreview(null)
        } finally {
            setIsParsing(false)
            resetInput()
        }
    }

    const handleApply = async () => {
        if (!preview || preview.diff.rows.length === 0) return

        await applyMutation.mutateAsync({ rows: preview.diff.rows })
        setConfirmOpen(false)
        setPreview(null)
    }

    const canApply =
        preview !== null &&
        preview.diff.errors.length === 0 &&
        preview.diff.rows.length > 0 &&
        !applyMutation.isPending

    return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                        <FileUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-950">İçe Aktar</h2>
                        <p className="max-w-2xl text-sm text-neutral-500">
                            Doldurulmuş dosyayı yükleyin. Önce değişiklikler listelenir, siz onaylayana kadar hiçbir şey
                            kaydedilmez. <span className="font-medium text-neutral-700">Boş bırakılan hücreler mevcut
                            metni silmez</span> — yarım doldurulmuş dosya güvenle yüklenebilir.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {preview ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => setPreview(null)}
                            disabled={applyMutation.isPending}
                        >
                            <X className="h-4 w-4" />
                            Temizle
                        </Button>
                    ) : null}

                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => inputRef.current?.click()}
                        disabled={isParsing || applyMutation.isPending}
                    >
                        {isParsing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {isParsing ? "Okunuyor" : "Dosya Seç"}
                    </Button>

                    <Button
                        type="button"
                        className="rounded-2xl"
                        onClick={() => setConfirmOpen(true)}
                        disabled={!canApply}
                    >
                        {applyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={`.xlsx,${XLSX_MIME}`}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleFile(file)
                }}
            />

            {preview ? (
                <>
                    <Separator className="my-4" />
                    <div className="mb-3 text-xs text-neutral-500">
                        Okunan dosya: <span className="font-medium text-neutral-700">{preview.fileName}</span>
                    </div>
                    <UsageFunctionImportPreview diff={preview.diff} payload={payload} />
                </>
            ) : null}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Değişiklikleri kaydet</DialogTitle>
                        <DialogDescription>
                            {preview?.diff.touchedRows ?? 0} kullanım satırında{" "}
                            {preview?.diff.changes.length ?? 0} çeviri hücresi güncellenecek. Bu işlem{" "}
                            <span className="font-medium text-neutral-700">
                                {payload.product.code} — {payload.product.name}
                            </span>{" "}
                            ürününü etkiler.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                disabled={applyMutation.isPending}
                            >
                                Vazgeç
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            className="rounded-2xl"
                            onClick={handleApply}
                            disabled={!canApply}
                        >
                            {applyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            {applyMutation.isPending ? "Kaydediliyor" : "Onayla ve Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
