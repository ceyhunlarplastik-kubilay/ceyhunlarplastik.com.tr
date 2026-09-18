import { BadgePercent } from "lucide-react"
import { CustomerPortalSpecialPricesPageClient } from "@/features/customerPortal/components/CustomerPortalSpecialPricesPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalSpecialPricesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<BadgePercent className="size-20" strokeWidth={1.5} />}
                    title="Özel fiyatlı ürünler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalSpecialPricesPageClient />
        </PageLoadingGate>
    )
}
