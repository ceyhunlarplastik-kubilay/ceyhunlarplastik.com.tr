"use client"

import { Video } from "lucide-react"
import { useTranslations } from "next-intl"
import ProductVideoFeatureSection from "@/features/public/products/components/ProductVideoFeatureSection"

type Props = {
    product: {
        name: string
        promoVideoUrl?: string | null
    }
    compact?: boolean
    showTitle?: boolean
    showDescription?: boolean
    imageMinHeightPx?: number
    videoOnly?: boolean
}

export default function ProductPromoVideoSection({
    product,
    compact = false,
    showTitle = true,
    showDescription = true,
    imageMinHeightPx,
    videoOnly = false,
}: Props) {
    const t = useTranslations("public.productDetail")

    return (
        <ProductVideoFeatureSection
            productName={product.name}
            videoUrl={product.promoVideoUrl}
            badgeIcon={<Video size={14} />}
            badgeLabel={t("assets.promoVideo.badge")}
            title={t("assets.promoVideo.title")}
            description={t("assets.promoVideo.description")}
            openButtonLabel={t("assets.promoVideo.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
            playLabel={t("assets.videoPlay")}
            compact={compact}
            showTitle={showTitle}
            showDescription={showDescription}
            imageMinHeightPx={imageMinHeightPx}
            videoOnly={videoOnly}
        />
    )
}
