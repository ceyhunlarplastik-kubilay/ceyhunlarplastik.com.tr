import { FileText } from "lucide-react"
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
}

export default function ProductTechnicalDrawingSection({ product, compact = false }: Props) {
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="TECHNICAL_DRAWING"
            badgeIcon={<FileText size={14} />}
            badgeLabel="Teknik Çizim"
            title="Teknik Çizim"
            description="Ürüne ait teknik çizim üzerinde ölçü ve form detaylarını inceleyebilirsiniz. Daha kapsamlı teknik dokümantasyon ve özel talepler için ekibimizle iletişime geçebilirsiniz."
            openButtonLabel="Teknik Çizimi Aç"
            missingMessage="Bu ürün için teknik çizim henüz eklenmemiştir. Talep oluşturarak teknik çizimi isteyebilirsiniz."
            compact={compact}
            interactiveImage
            showTitle={!compact}
            showDescription={!compact}
            descriptionClassName={compact ? "mt-2 text-xs leading-5 text-neutral-600" : undefined}
            imageMinHeightPx={compact ? 280 : 360}
        />
    )
}
