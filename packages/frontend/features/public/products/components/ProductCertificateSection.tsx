"use client"

import { ShieldCheck } from "lucide-react"
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

export default function ProductCertificateSection({ product }: Props) {
    const t = useTranslations("public.productDetail")
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="CERTIFICATE"
            badgeIcon={<ShieldCheck size={14} />}
            badgeLabel={t("assets.certificate.badge")}
            title={t("assets.certificate.title")}
            description={t("assets.certificate.description")}
            openButtonLabel={t("assets.certificate.open")}
            requestInfoLabel={t("assetSection.requestInfo")}
            offerImageAlt={t("assetSection.offerImageAlt")}
        />
    )
}
