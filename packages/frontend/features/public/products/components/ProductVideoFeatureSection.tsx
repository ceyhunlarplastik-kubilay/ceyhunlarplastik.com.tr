"use client"

import type { ReactNode } from "react"
import ProductAssetFeatureSection from "@/features/public/products/components/ProductAssetFeatureSection"
import ProductYoutubeEmbed from "@/features/public/products/components/ProductYoutubeEmbed"

type Props = {
    productName: string
    videoUrl?: string | null
    badgeIcon?: ReactNode
    badgeLabel: string
    title: string
    description: string
    openButtonLabel: string
    requestInfoLabel: string
    offerImageAlt: string
    playLabel: string
    compact?: boolean
    showTitle?: boolean
    showDescription?: boolean
    imageMinHeightPx?: number
    /** Kart/metin olmadan yalnız oynatıcıyı basar (hero ve portal yerleşimleri). */
    videoOnly?: boolean
}

/**
 * Ürün videosu bölümlerinin (montaj + tanıtım) ortak gövdesi.
 * Videolar YouTube'da barındırılır; DB'de Product.assemblyVideoUrl /
 * Product.promoVideoUrl kolonlarında yalnız watch URL'i tutulur.
 */
export default function ProductVideoFeatureSection({
    productName,
    videoUrl,
    badgeIcon,
    badgeLabel,
    title,
    description,
    openButtonLabel,
    requestInfoLabel,
    offerImageAlt,
    playLabel,
    compact = false,
    showTitle = true,
    showDescription = true,
    imageMinHeightPx,
    videoOnly = false,
}: Props) {
    const hasVideo = Boolean(videoUrl)

    const player = videoUrl ? (
        <ProductYoutubeEmbed
            url={videoUrl}
            title={`${productName} — ${title}`}
            playLabel={playLabel}
            minHeightPx={imageMinHeightPx ?? (videoOnly ? 220 : compact ? 180 : 280)}
        />
    ) : null

    if (videoOnly) {
        if (!player) return null

        return (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-sm">
                {player}
            </div>
        )
    }

    return (
        <ProductAssetFeatureSection
            productName={productName}
            media={player}
            hasMedia={hasVideo}
            openHref={videoUrl ?? undefined}
            badgeIcon={badgeIcon}
            badgeLabel={badgeLabel}
            title={title}
            description={description}
            openButtonLabel={openButtonLabel}
            requestInfoLabel={requestInfoLabel}
            offerImageAlt={offerImageAlt}
            compact={compact}
            showTitle={showTitle}
            showDescription={showDescription}
            imageMinHeightPx={imageMinHeightPx}
        />
    )
}
