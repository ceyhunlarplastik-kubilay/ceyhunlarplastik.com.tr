import { Settings } from "lucide-react"
import { ProductAttributesPageClient } from "@/features/admin/productAttributes/components/ProductAttributesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ContentEntryProductAttributesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Settings className="size-20" strokeWidth={1.5} />}
                    title="Özellikler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <ProductAttributesPageClient
                basePath="/veri-girisi/productAttributes"
                title="Özellikler"
                description="Sektör, üretim grubu, endüstriyel kullanım alanı ve diğer ürün özellik değerlerini yönetin."
            />
        </PageLoadingGate>
    )
}
