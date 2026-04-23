import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import InteractiveZoomImage from "@/features/public/products/components/InteractiveZoomImage"

type Asset = {
    id: string
    role?: string
    mimeType?: string
    url?: string
}

type Props = {
    productName: string
    assets?: Asset[]
    role: string
    badgeIcon?: ReactNode
    badgeLabel: string
    title: string
    description: string
    openButtonLabel: string
    missingMessage?: string
    fallbackImageSrc?: string
    requestHref?: string
    compact?: boolean
    interactiveImage?: boolean
    showTitle?: boolean
    showDescription?: boolean
    descriptionClassName?: string
    imageMinHeightPx?: number
}

export default function ProductAssetFeatureSection({
    productName,
    assets,
    role,
    badgeIcon,
    badgeLabel,
    title,
    description,
    openButtonLabel,
    missingMessage = "Bu içerik henüz eklenmemiştir. Talep oluşturarak detayları isteyebilirsiniz.",
    fallbackImageSrc = "/ceyhunlar-teklif-al.webp",
    requestHref = "/iletisim",
    compact = false,
    interactiveImage = false,
    showTitle = true,
    showDescription = true,
    descriptionClassName,
    imageMinHeightPx,
}: Props) {
    const asset = assets?.find((item) => item.role === role)
    const hasAsset = Boolean(asset?.url)
    const previewSrc = asset?.url ?? fallbackImageSrc
    const isPdf = asset?.mimeType === "application/pdf"
    const isVideo = asset?.mimeType?.startsWith("video/")
    const imageMinHeight = imageMinHeightPx ?? (compact ? 180 : 280)

    return (
        <section className={compact ? "" : "mt-10"}>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className={compact ? "grid grid-cols-1" : "grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]"}>
                    <div className="relative bg-neutral-50" style={{ minHeight: imageMinHeight }}>
                        {hasAsset && isVideo ? (
                            <video
                                src={previewSrc}
                                controls
                                className="h-full w-full object-contain"
                                style={{ minHeight: imageMinHeight }}
                            />
                        ) : hasAsset && isPdf ? (
                            <iframe
                                src={previewSrc}
                                title={`${productName} ${title}`}
                                className="h-full w-full"
                                style={{ minHeight: imageMinHeight }}
                            />
                        ) : interactiveImage && hasAsset ? (
                            <InteractiveZoomImage
                                src={previewSrc}
                                alt={hasAsset ? `${productName} ${title}` : "Teklif görseli"}
                                compact={compact}
                            />
                        ) : (
                            <Image
                                src={previewSrc}
                                alt={hasAsset ? `${productName} ${title}` : "Teklif görseli"}
                                fill
                                className={`object-contain ${compact ? "p-2" : "p-3"}`}
                                sizes="(min-width: 1024px) 60vw, 100vw"
                            />
                        )}
                    </div>

                    <div className={`flex flex-col justify-between ${compact ? "p-4" : "p-6 lg:p-8"}`}>
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                                {badgeIcon}
                                {badgeLabel}
                            </div>

                            {showTitle ? (
                                <h3 className={`${compact ? "text-lg" : "text-2xl"} font-semibold tracking-tight text-neutral-900`}>
                                    {title}
                                </h3>
                            ) : null}

                            {showDescription ? (
                                <p className={descriptionClassName ?? `mt-3 text-sm text-neutral-600 ${compact ? "leading-5" : "leading-6"}`}>
                                    {description}
                                </p>
                            ) : null}

                            {/* {!hasAsset && (
                                <p className="mt-3 text-sm text-amber-700">
                                    {missingMessage}
                                </p>
                            )} */}
                        </div>

                        <div className={`${compact ? "mt-4" : "mt-6"} flex flex-wrap gap-3`}>
                            {hasAsset && (
                                <Link
                                    href={previewSrc}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center justify-center rounded-xl bg-[var(--color-brand)] ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"} font-semibold text-white transition-opacity hover:opacity-90`}
                                >
                                    {openButtonLabel}
                                </Link>
                            )}

                            <Link
                                href={requestHref}
                                className={`inline-flex items-center justify-center rounded-xl border border-neutral-300 ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"} font-semibold text-neutral-800 transition-colors hover:bg-neutral-100`}
                            >
                                Detaylı Bilgi Talep Et
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
