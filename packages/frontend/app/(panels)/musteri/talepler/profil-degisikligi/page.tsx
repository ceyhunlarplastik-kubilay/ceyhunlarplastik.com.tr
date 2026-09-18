import { Settings } from "lucide-react"
import { CustomerPortalRequestCreatePageClient } from "@/features/customerPortal/components/CustomerPortalRequestCreatePageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function CustomerPortalProfileRequestPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Settings className="size-20" strokeWidth={1.5} />}
                    title="Profil değişikliği talebi hazırlanıyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerPortalRequestCreatePageClient type="CUSTOMER_PROFILE_CHANGE" />
        </PageLoadingGate>
    )
}
