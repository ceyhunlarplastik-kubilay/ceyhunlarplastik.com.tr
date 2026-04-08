import { Clapperboard } from "lucide-react"
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

export default function ProductAssemblyVideoSection({ product }: Props) {
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
        />
    )
}
