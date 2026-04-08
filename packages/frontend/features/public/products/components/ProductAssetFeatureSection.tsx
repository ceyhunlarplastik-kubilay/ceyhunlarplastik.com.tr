import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"

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
}: Props) {
    const asset = assets?.find((item) => item.role === role)
    const hasAsset = Boolean(asset?.url)
    const previewSrc = asset?.url ?? fallbackImageSrc
    const isPdf = asset?.mimeType === "application/pdf"
    const isVideo = asset?.mimeType?.startsWith("video/")

    return (
        <section className="mt-10">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
                    <div className="relative min-h-[280px] bg-neutral-50">
                        {hasAsset && isVideo ? (
                            <video
                                src={previewSrc}
                                controls
                                className="h-full w-full min-h-[280px] object-contain"
                            />
                        ) : hasAsset && isPdf ? (
                            <iframe
                                src={previewSrc}
                                title={`${productName} ${title}`}
                                className="h-full w-full min-h-[280px]"
                            />
                        ) : (
                            <Image
                                src={previewSrc}
                                alt={hasAsset ? `${productName} ${title}` : "Teklif görseli"}
                                fill
                                className="object-contain p-3"
                                sizes="(min-width: 1024px) 60vw, 100vw"
                            />
                        )}
                    </div>

                    <div className="flex flex-col justify-between p-6 lg:p-8">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                                {badgeIcon}
                                {badgeLabel}
                            </div>

                            <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
                                {title}
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-neutral-600">
                                {description}
                            </p>

                            {/* {!hasAsset && (
                                <p className="mt-3 text-sm text-amber-700">
                                    {missingMessage}
                                </p>
                            )} */}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {hasAsset && (
                                <Link
                                    href={previewSrc}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                >
                                    {openButtonLabel}
                                </Link>
                            )}

                            <Link
                                href={requestHref}
                                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
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
