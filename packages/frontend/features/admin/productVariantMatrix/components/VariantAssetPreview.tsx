"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageOff, ZoomIn } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
    src: string | null
    alt: string
    /** Çerçevenin altındaki küçük başlık — "Ürün", "Teknik resim". */
    label: string
}

/**
 * Bağlam sütunundaki kare görsel çerçevesi; tıklanınca büyük hâli diyalogda açılır.
 *
 * Operatör teknik resmi okumak zorunda — 140px'lik küçük çerçevede ölçü çizgileri
 * seçilmiyor. Public taraftaki `ProductTechnicalDrawingSection` aynı ihtiyacı
 * `InteractiveZoomImage` ile çözüyor; burada panel dar olduğu için diyalog daha
 * uygun.
 */
export function VariantAssetPreview({ src, alt, label }: Props) {
    const [failed, setFailed] = useState(false)
    const hasImage = Boolean(src) && !failed

    const frame = (
        <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-neutral-50 dark:bg-neutral-900">
            {hasImage ? (
                <>
                    <Image
                        src={src as string}
                        alt={alt}
                        fill
                        sizes="264px"
                        className="object-contain"
                        onError={() => setFailed(true)}
                    />
                    <span className="pointer-events-none absolute end-1.5 top-1.5 rounded-md bg-white/85 p-1 text-neutral-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:bg-neutral-900/85">
                        <ZoomIn className="size-3.5" />
                    </span>
                </>
            ) : (
                <div className="flex size-full items-center justify-center text-neutral-400">
                    <ImageOff className="size-5" />
                </div>
            )}
        </div>
    )

    return (
        <figure className="m-0 space-y-1">
            {hasImage ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="group block w-full cursor-zoom-in rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            aria-label={`${label} görselini büyüt`}
                        >
                            {frame}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{label}</DialogTitle>
                        </DialogHeader>
                        <div className="relative max-h-[75vh] min-h-[50vh] w-full">
                            <Image src={src as string} alt={alt} fill className="object-contain" sizes="90vw" />
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                frame
            )}
            <figcaption className="text-center text-[11px] text-neutral-500">{label}</figcaption>
        </figure>
    )
}
