import { Settings } from "lucide-react"
import { CustomerPortalProfilePageClient } from "@/features/customerPortal/components/CustomerPortalProfilePageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalProfilePage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Settings className="size-20" strokeWidth={1.5} />}
                    title="Profil ayarları yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalProfilePageClient />
        </PageLoadingGate>
    )
}
