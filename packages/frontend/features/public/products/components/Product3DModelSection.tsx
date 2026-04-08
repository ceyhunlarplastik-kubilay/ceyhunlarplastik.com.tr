import { Box } from "lucide-react"
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
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="MODEL_3D"
            badgeIcon={<Box size={14} />}
            badgeLabel="3D Model"
            title="3D Model"
            description="Ürünün 3D modelini inceleyerek form detaylarını daha gerçekçi şekilde değerlendirebilirsiniz. CAD/teknik ihtiyaçlarınız için ekibimizle iletişime geçebilirsiniz."
            openButtonLabel="3D Modeli Aç"
            missingMessage="Bu ürün için 3D model henüz eklenmemiştir. Talep oluşturarak 3D model isteyebilirsiniz."
        />
    )
}
