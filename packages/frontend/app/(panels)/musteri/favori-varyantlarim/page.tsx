import { Heart } from "lucide-react"
import { CustomerPortalFavoriteVariantsPageClient } from "@/features/customerPortal/components/CustomerPortalFavoriteVariantsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalFavoriteVariantsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Heart className="size-20" strokeWidth={1.5} />}
                    title="Favori varyantlar yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalFavoriteVariantsPageClient />
        </PageLoadingGate>
    )
}
