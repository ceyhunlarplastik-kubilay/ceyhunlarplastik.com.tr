import { Megaphone } from "lucide-react"
import { AnnouncementsPageClient } from "@/features/sales/campaignAnnouncements/components/AnnouncementsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CampaignAnnouncementsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Megaphone className="size-20" strokeWidth={1.5} />}
                    title="Duyurular yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <AnnouncementsPageClient />
        </PageLoadingGate>
    )
}
