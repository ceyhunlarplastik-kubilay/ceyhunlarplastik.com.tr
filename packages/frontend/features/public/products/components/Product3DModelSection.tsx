"use client"

import { Box } from "lucide-react"
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
}

export default function Product3DModelSection({ product }: Props) {
    const t = useTranslations("public.productDetail")
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="MODEL_3D"
            badgeIcon={<Box size={14} />}
            badgeLabel={t("assets.model3d.badge")}
            title={t("assets.model3d.title")}
            description={t("assets.model3d.description")}
            openButtonLabel={t("assets.model3d.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
        />
    )
}
