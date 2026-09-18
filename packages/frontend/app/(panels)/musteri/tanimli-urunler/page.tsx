import { BookMarked } from "lucide-react"
import { CustomerPortalProductsPageClient } from "@/features/customerPortal/components/CustomerPortalProductsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalProductsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<BookMarked className="size-20" strokeWidth={1.5} />}
                    title="İlgili ürün modelleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalProductsPageClient />
        </PageLoadingGate>
    )
}
