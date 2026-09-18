import { Megaphone } from "lucide-react"
import { CustomerPortalCampaignsPageClient } from "@/features/customerPortal/components/CustomerPortalCampaignsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalCampaignsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Megaphone className="size-20" strokeWidth={1.5} />}
                    title="Kampanyalı ürünler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalCampaignsPageClient />
        </PageLoadingGate>
    )
}
