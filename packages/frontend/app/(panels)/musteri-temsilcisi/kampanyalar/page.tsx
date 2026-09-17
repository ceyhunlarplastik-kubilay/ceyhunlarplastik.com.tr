import { Megaphone } from "lucide-react"
import { CampaignsPageClient } from "@/features/sales/campaigns/components/CampaignsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesCampaignsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Megaphone className="size-20" strokeWidth={1.5} />}
                    title="Kampanyalar yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CampaignsPageClient />
        </PageLoadingGate>
    )
}
