import { CustomerPortalOverviewPageClient } from "@/features/customerPortal/components/CustomerPortalOverviewPageClient"
import { getPortalCustomerOverview } from "@/features/customerPortal/server/getPortalCustomerOverview"

// Panel ilk-yük dilim 3: overview RSC'de çekilir, client'a initialData geçer →
// ilk boya spinner'sız dolu. Server fetch başarısızsa undefined → client hook
// kendi fetch'ine düşer (zarif düşüş).
export default async function CustomerPortalPage() {
    const initialOverview = await getPortalCustomerOverview()

    return <CustomerPortalOverviewPageClient initialOverview={initialOverview ?? undefined} />
}
