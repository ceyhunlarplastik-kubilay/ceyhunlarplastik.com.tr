"use client"

import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import ProductAssetFeatureSection from "@/features/public/products/components/ProductAssetFeatureSection"

type Asset = {
    id: string
    role?: string
    mimeType?: string
    url?: string
}

type Props = {
    product: {
        name: string
        assets?: Asset[]
    }
    compact?: boolean
    mediaOnly?: boolean
}

export default function ProductTechnicalDrawingSection({ product, compact = false, mediaOnly = false }: Props) {
    const t = useTranslations("public.productDetail")
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="TECHNICAL_DRAWING"
            badgeIcon={<FileText size={14} />}
            badgeLabel={t("assets.technicalDrawing.badge")}
            title={t("assets.technicalDrawing.title")}
            description={t("assets.technicalDrawing.description")}
            openButtonLabel={t("assets.technicalDrawing.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
            compact={compact}
            interactiveImage
            showTitle={!compact}
            showDescription={!compact}
            descriptionClassName={compact ? "mt-2 text-xs leading-5 text-neutral-600" : undefined}
            imageMinHeightPx={compact ? 280 : 360}
            mediaOnly={mediaOnly}
        />
    )
}
