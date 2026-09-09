import { Forklift } from "lucide-react"
import { CustomerPortalRequestCreatePageClient } from "@/features/customerPortal/components/CustomerPortalRequestCreatePageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalOrderRequestPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Forklift className="size-20" strokeWidth={1.5} />}
                    title="Sipariş talebi hazırlanıyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalRequestCreatePageClient type="CUSTOMER_ORDER_REQUEST" />
        </PageLoadingGate>
    )
}
