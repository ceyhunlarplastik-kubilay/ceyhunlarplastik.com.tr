import { ClipboardList } from "lucide-react"
import { CustomerPortalRequestCreatePageClient } from "@/features/customerPortal/components/CustomerPortalRequestCreatePageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalDocumentRequestPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardList className="size-20" strokeWidth={1.5} />}
                    title="Doküman talebi hazırlanıyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalRequestCreatePageClient type="CUSTOMER_DOCUMENT_REQUEST" />
        </PageLoadingGate>
    )
}
