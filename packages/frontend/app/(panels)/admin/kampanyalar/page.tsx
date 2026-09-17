import { Megaphone } from "lucide-react"
import { CampaignsPageClient } from "@/features/sales/campaigns/components/CampaignsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

/**
 * Aynı ekran iki çalışma alanında: satış müdürü `/musteri-temsilcisi` altından, admin/owner
 * kendi panelinden ulaşır. Uç tek: ProtectedApi `/sales/product-variant-campaigns`.
 */
export default function AdminCampaignsPage() {
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
