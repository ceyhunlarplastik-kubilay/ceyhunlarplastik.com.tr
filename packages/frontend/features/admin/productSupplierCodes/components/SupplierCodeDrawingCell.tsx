"use client"

import { useRef } from "react"
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react"

import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from "@/components/ui/attachment"
import { Spinner } from "@/components/ui/spinner"

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
 * Tedarikçi harfi başına TEK teknik resim slotu — shadcn `Attachment` ile.
 * Durumlar: idle (boş, kesikli kenar → tıkla-seç) · uploading · processing
 * (PENDING_UPLOAD, S3 onayı bekleniyor) · error · done (ACTIVE, önizleme + Değiştir/Sil).
 * Yükleme bloklamaz; reconciler PENDING iken listeyi tazeler.
 */
export function SupplierCodeDrawingCell({ productId, entry }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const uploadMutation = useUploadProductSupplierCodeDrawing(productId)
    const deleteMutation = useDeleteProductSupplierCodeDrawing(productId)

    const drawing = entry.technicalDrawing
    const isImage = drawing?.mimeType.startsWith("image/") ?? false
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

    const state: "idle" | "uploading" | "processing" | "error" | "done" =
        uploadMutation.isPending || deleteMutation.isPending
            ? "uploading"
            : uploadMutation.isError
                ? "error"
                : drawing?.uploadStatus === "PENDING_UPLOAD"
                    ? "processing"
                    : drawing
                        ? "done"
                        : "idle"

    const title =
        state === "done"
            ? "Teknik resim"
            : state === "processing"
                ? "İşleniyor"
                : state === "uploading"
                    ? "Yükleniyor…"
                    : state === "error"
                        ? "Yüklenemedi"
                        : "Teknik resim yükle"

    const description =
        state === "done"
            ? isImage
                ? "Görseli aç"
                : "PDF · aç"
            : state === "processing"
                ? "Arka planda doğrulanıyor"
                : state === "error"
                    ? "Tekrar denemek için tıklayın"
                    : state === "idle"
                        ? "PNG, JPG veya PDF"
                        : " "

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFile}
            />

            <Attachment size="sm" state={state} className="min-w-0">
                <AttachmentMedia variant={state === "done" && isImage ? "image" : "icon"}>
                    {state === "uploading" || state === "processing" ? (
                        <Spinner data-slot="spinner" />
                    ) : state === "done" && isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Attachment CSS bare <img> hedefliyor
                        <img src={drawing!.url} alt="" />
                    ) : state === "done" ? (
                        <FileText />
                    ) : (
                        <Upload />
                    )}
                </AttachmentMedia>

                <AttachmentContent>
                    <AttachmentTitle>{title}</AttachmentTitle>
                    <AttachmentDescription>{description}</AttachmentDescription>
                </AttachmentContent>

                {state === "done" ? (
                    <>
                        <AttachmentTrigger asChild>
                            <a
                                href={drawing!.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Teknik resmi aç"
                            />
                        </AttachmentTrigger>
                        <AttachmentActions>
                            <AttachmentAction
                                aria-label="Teknik resmi değiştir"
                                title="Değiştir"
                                onClick={pickFile}
                                disabled={busy}
                            >
                                <RefreshCw />
                            </AttachmentAction>
                            <AttachmentAction
                                aria-label="Teknik resmi sil"
                                title="Sil"
                                onClick={() => deleteMutation.mutate(drawing!.id)}
                                disabled={busy}
                            >
                                <Trash2 className="text-destructive" />
                            </AttachmentAction>
                        </AttachmentActions>
                    </>
                ) : state === "idle" || state === "error" ? (
                    <AttachmentTrigger onClick={pickFile} aria-label="Teknik resim seç" />
                ) : null}
            </Attachment>
        </>
    )
}
