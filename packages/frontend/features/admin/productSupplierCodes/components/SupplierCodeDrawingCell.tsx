"use client"

import { useRef } from "react"
import { FileText, ImageOff, Loader2, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
    useDeleteProductSupplierCodeDrawing,
    useUploadProductSupplierCodeDrawing,
} from "@/features/admin/productSupplierCodes/hooks/useProductSupplierCodes"
import type { ProductSupplierCodeEntry } from "@/features/admin/productSupplierCodes/api/types"

const ACCEPT = "image/*,application/pdf"

type Props = {
    productId: string
    entry: ProductSupplierCodeEntry
}

/**
 * Tedarikçi harfi başına TEK teknik resim slotu. Boşsa "Yükle"; doluysa küçük
 * önizleme + "Değiştir" (eskiyi sil + yeniyi yükle) + "Sil". Yükleme bloklamaz —
 * satır PENDING iken "İşleniyor" rozeti, S3 onayı gelince kalkar (reconciler).
 */
export function SupplierCodeDrawingCell({ productId, entry }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const uploadMutation = useUploadProductSupplierCodeDrawing(productId)
    const deleteMutation = useDeleteProductSupplierCodeDrawing(productId)

    const drawing = entry.technicalDrawing
    const pending = drawing?.uploadStatus === "PENDING_UPLOAD"
    const busy = uploadMutation.isPending || deleteMutation.isPending

    const pickFile = () => inputRef.current?.click()

    const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = "" // aynı dosya tekrar seçilebilsin
        if (!file) return
        uploadMutation.mutate({
            codeId: entry.id,
            file,
            replaceAssetId: drawing?.id ?? null,
        })
    }

    return (
        <div className="flex items-center gap-2">
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFile}
            />

            {pending ? (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    İşleniyor
                </Badge>
            ) : drawing ? (
                <>
                    <a
                        href={drawing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded border bg-muted"
                        title="Teknik resmi aç"
                    >
                        {drawing.mimeType.startsWith("image/") ? (
                            <img
                                src={drawing.url}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                            />
                        ) : (
                            <span className="flex h-10 w-10 items-center justify-center">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </span>
                        )}
                    </a>

                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={pickFile}
                        disabled={busy}
                    >
                        {uploadMutation.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : (
                            "Değiştir"
                        )}
                    </Button>

                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label="Teknik resmi sil"
                        onClick={() => deleteMutation.mutate(drawing.id)}
                        disabled={busy}
                    >
                        {deleteMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="size-3.5 text-red-600" />
                        )}
                    </Button>
                </>
            ) : (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={pickFile}
                    disabled={busy}
                >
                    {uploadMutation.isPending ? (
                        <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                        <Upload className="mr-1 size-3" />
                    )}
                    Yükle
                </Button>
            )}

            {uploadMutation.isError && !busy ? (
                <ImageOff className="size-3.5 text-red-600" aria-label="Yükleme başarısız" />
            ) : null}
        </div>
    )
}
