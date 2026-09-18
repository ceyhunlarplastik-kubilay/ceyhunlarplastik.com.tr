import { PackageCheck } from "lucide-react"
import { CustomerPortalOrdersPageClient } from "@/features/customerPortal/components/CustomerPortalOrdersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalOrdersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<PackageCheck className="size-20" strokeWidth={1.5} />}
                    title="Siparişler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalOrdersPageClient />
        </PageLoadingGate>
    )
}
