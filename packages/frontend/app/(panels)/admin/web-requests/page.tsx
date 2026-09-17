import { ClipboardList } from "lucide-react"
import { WebRequestsPageClient } from "@/features/admin/webRequests/components/WebRequestsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminWebRequestsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardList className="size-20" strokeWidth={1.5} />}
                    title="Web talepleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <WebRequestsPageClient />
        </PageLoadingGate>
    )
}
