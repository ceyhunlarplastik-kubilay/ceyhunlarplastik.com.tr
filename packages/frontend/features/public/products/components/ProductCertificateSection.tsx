import { ShieldCheck } from "lucide-react"
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
    return (
        <ProductAssetFeatureSection
            productName={product.name}
            assets={product.assets}
            role="CERTIFICATE"
            badgeIcon={<ShieldCheck size={14} />}
            badgeLabel="Sertifika"
            title="Sertifika"
            description="Ürüne ait kalite ve uygunluk belgelerini bu alandan görüntüleyebilirsiniz. Detaylı belge talebiniz varsa ekibimiz yardımcı olacaktır."
            openButtonLabel="Sertifikayı Aç"
            missingMessage="Bu ürün için sertifika henüz eklenmemiştir. Talep oluşturarak sertifika isteyebilirsiniz."
        />
    )
}
