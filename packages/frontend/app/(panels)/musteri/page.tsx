import { LayoutDashboard } from "lucide-react"
import { CustomerPortalOverviewPageClient } from "@/features/customerPortal/components/CustomerPortalOverviewPageClient"
import { getPortalCustomerOverview } from "@/features/customerPortal/server/getPortalCustomerOverview"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

// Panel ilk-yük dilim 3: overview RSC'de çekilir, client'a initialData geçer →
// ilk boya spinner'sız dolu. Server fetch başarısızsa undefined → client hook
// kendi fetch'ine düşer (zarif düşüş).
export default async function CustomerPortalPage() {
    const initialOverview = await getPortalCustomerOverview()

    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<LayoutDashboard className="size-20" strokeWidth={1.5} />}
                    title="Profil yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalOverviewPageClient initialOverview={initialOverview ?? undefined} />
        </PageLoadingGate>
    )
}
