import { BadgePercent } from "lucide-react"
import { CustomerPortalRequestCreatePageClient } from "@/features/customerPortal/components/CustomerPortalRequestCreatePageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalPricingRequestPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<BadgePercent className="size-20" strokeWidth={1.5} />}
                    title="Fiyat talebi hazırlanıyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalRequestCreatePageClient type="CUSTOMER_PRICING_REQUEST" />
        </PageLoadingGate>
    )
}
