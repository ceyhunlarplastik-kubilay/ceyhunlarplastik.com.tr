"use client"

import { Box } from "lucide-react"
import { useTranslations } from "next-intl"
import ProductAssetFeatureSection from "@/features/public/products/components/ProductAssetFeatureSection"
import Product3DModelViewer from "@/features/public/products/components/Product3DModelViewer"

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

const MODEL_MIME_TYPES = new Set([
    "model/gltf+json",
    "model/gltf-binary",
])

function isSupportedModelAsset(asset: Asset) {
    if (!asset.url || asset.role !== "MODEL_3D") return false

    const mimeType = asset.mimeType?.toLowerCase().split(";")[0].trim()
    const path = asset.url.toLowerCase().split(/[?#]/)[0]

    return MODEL_MIME_TYPES.has(mimeType ?? "") || path.endsWith(".gltf") || path.endsWith(".glb")
}

export default function Product3DModelSection({ product }: Props) {
    const t = useTranslations("public.productDetail")
    const modelAsset = product.assets?.find(isSupportedModelAsset)

    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={modelAsset ? [modelAsset] : []}
            role="MODEL_3D"
            badgeIcon={<Box size={14} />}
            badgeLabel={t("assets.model3d.badge")}
            title={t("assets.model3d.title")}
            description={t("assets.model3d.description")}
            openButtonLabel={t("assets.model3d.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
            imageMinHeightPx={modelAsset ? 430 : undefined}
            media={modelAsset?.url ? (
                <Product3DModelViewer
                    src={modelAsset.url}
                    alt={t("assets.model3d.alt", { name: product.name })}
                    loadingLabel={t("assets.model3d.loading")}
                    errorTitle={t("assets.model3d.errorTitle")}
                    errorDescription={t("assets.model3d.errorDescription")}
                    interactionHint={t("assets.model3d.interactionHint")}
                    resetViewLabel={t("assets.model3d.resetView")}
                    fullscreenLabel={t("assets.model3d.fullscreen")}
                />
            ) : undefined}
            hasMedia={Boolean(modelAsset?.url)}
            openHref={modelAsset?.url}
        />
    )
}
