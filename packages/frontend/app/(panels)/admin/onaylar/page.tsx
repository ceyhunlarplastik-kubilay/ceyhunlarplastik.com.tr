import { ClipboardCheck } from "lucide-react"
import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminBusinessRequestsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardCheck className="size-20" strokeWidth={1.5} />}
                    title="İş talep onayları yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <BusinessRequestInboxPageClient
                scope="admin"
                title="İş Talep Onayları"
                description="Satış ve satın alma domainlerindeki tüm generic workflow taleplerini tek ekranda yönetin."
                showDomainFilter
            />
        </PageLoadingGate>
    )
}
