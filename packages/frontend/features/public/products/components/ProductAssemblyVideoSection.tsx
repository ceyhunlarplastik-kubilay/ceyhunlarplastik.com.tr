import { Clapperboard } from "lucide-react"
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
            badgeLabel="Montaj Videosu"
            title="Montaj Videosu"
            description="Kurulum ve montaj adımlarını videodan izleyerek uygulamayı daha hızlı tamamlayabilirsiniz. Özel montaj ihtiyaçlarınız için bizimle iletişime geçebilirsiniz."
            openButtonLabel="Montaj Videosunu Aç"
            missingMessage="Bu ürün için montaj videosu henüz eklenmemiştir. Talep oluşturarak montaj videosu isteyebilirsiniz."
            compact={compact}
            showTitle={showTitle}
            showDescription={showDescription}
            imageMinHeightPx={imageMinHeightPx}
        />
    )
}
