import { ShieldCheck } from "lucide-react"
import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesApprovalRequestsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ShieldCheck className="size-20" strokeWidth={1.5} />}
                    title="Onay talepleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <BusinessRequestInboxPageClient
                scope="sales"
                title="Müşteri Temsilcisi Onay Talepleri"
                description="Müşteri portalından ve satış ekibinden gelen talepleri inceleyin. Satış direktörü bu ekranda satış adımlarını override edebilir."
                defaultDomain="SALES"
            />
        </PageLoadingGate>
    )
}
