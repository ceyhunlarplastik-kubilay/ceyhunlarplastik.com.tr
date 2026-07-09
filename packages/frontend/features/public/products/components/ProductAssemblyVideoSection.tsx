"use client"

import { Clapperboard } from "lucide-react"
import { useTranslations } from "next-intl"
import ProductAssetFeatureSection from "@/features/public/products/components/ProductAssetFeatureSection"

type Asset = {
    id: string
    role?: string
    type?: string
    mimeType?: string
    url?: string
}

type Props = {
    product: {
        name: string
        assets?: Asset[]
    }
    compact?: boolean
    autoPlayVideo?: boolean
    showTitle?: boolean
    showDescription?: boolean
    imageMinHeightPx?: number
    videoOnly?: boolean
}

export default function ProductAssemblyVideoSection({
    product,
    compact = false,
    autoPlayVideo = false,
    showTitle = true,
    showDescription = true,
    imageMinHeightPx,
    videoOnly = false,
}: Props) {
    const t = useTranslations("public.productDetail")
    if (videoOnly) {
        const videoAsset = product.assets?.find((asset) => asset.role === "ASSEMBLY_VIDEO" && asset.url)

        if (!videoAsset?.url) return null

        return (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-sm">
                <video
                    src={videoAsset.url}
                    controls
                    autoPlay={autoPlayVideo}
                    muted={autoPlayVideo}
                    playsInline
                    preload={autoPlayVideo ? "auto" : "metadata"}
                    className="h-full w-full object-contain"
                    style={{ minHeight: imageMinHeightPx ?? 220 }}
                />
            </div>
        )
    }

    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="ASSEMBLY_VIDEO"
            badgeIcon={<Clapperboard size={14} />}
            badgeLabel={t("assets.assemblyVideo.badge")}
            title={t("assets.assemblyVideo.title")}
            description={t("assets.assemblyVideo.description")}
            openButtonLabel={t("assets.assemblyVideo.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
            compact={compact}
            showTitle={showTitle}
            showDescription={showDescription}
            imageMinHeightPx={imageMinHeightPx}
        />
    )
}
