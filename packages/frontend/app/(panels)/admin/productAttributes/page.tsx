import { Settings } from "lucide-react"
import { ProductAttributesPageClient } from "@/features/admin/productAttributes/components/ProductAttributesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function Page() {
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
            <ProductAttributesPageClient />
        </PageLoadingGate>
    )
}
