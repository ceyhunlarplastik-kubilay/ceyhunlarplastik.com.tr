import { ClipboardList } from "lucide-react"
import { CustomerPortalRequestsPageClient } from "@/features/customerPortal/components/CustomerPortalRequestsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalRequestsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardList className="size-20" strokeWidth={1.5} />}
                    title="Talepler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalRequestsPageClient />
        </PageLoadingGate>
    )
}
