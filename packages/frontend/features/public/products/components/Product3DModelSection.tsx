"use client"

import { Box } from "lucide-react"
import { useTranslations } from "next-intl"
import ProductAssetFeatureSection from "@/features/public/products/components/ProductAssetFeatureSection"
import Product3DConfigurator from "@/features/public/products/components/Product3DConfigurator"
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"

type Asset = {
    id: string
    role?: string
    mimeType?: string
    url?: string
    model3dConfig?: ProductModel3dConfig
}

type Props = {
    product: {
        name: string
        assets?: Asset[]
    }
    options?: GroupedMeasurementOption[]
}

const MODEL_MIME_TYPES = new Set([
    "model/gltf-binary",
])

function isSupportedModelAsset(asset: Asset) {
    if (!asset.url || asset.role !== "MODEL_3D") return false

    const mimeType = asset.mimeType?.toLowerCase().split(";")[0].trim()
    const path = asset.url.toLowerCase().split(/[?#]/)[0]

    return MODEL_MIME_TYPES.has(mimeType ?? "") || path.endsWith(".glb")
}

export default function Product3DModelSection({ product, options = [] }: Props) {
    const t = useTranslations("public.productDetail")
    const variantT = useTranslations("public.productVariant.table")
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
                <Product3DConfigurator
                    src={modelAsset.url}
                    config={modelAsset.model3dConfig}
                    options={options}
                    viewerLabels={{
                        alt: t("assets.model3d.alt", { name: product.name }),
                        loadingLabel: t("assets.model3d.loading"),
                        errorTitle: t("assets.model3d.errorTitle"),
                        errorDescription: t("assets.model3d.errorDescription"),
                        interactionHint: t("assets.model3d.interactionHint"),
                        resetViewLabel: t("assets.model3d.resetView"),
                        fullscreenLabel: t("assets.model3d.fullscreen"),
                    }}
                    selectorLabels={{
                        measurement: variantT("selectedDetailsTitle"),
                        color: variantT("colColor"),
                        material: variantT("colMaterial"),
                    }}
                />
            ) : undefined}
            hasMedia={Boolean(modelAsset?.url)}
            openHref={modelAsset?.url}
        />
    )
}
