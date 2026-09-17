import { Users } from "lucide-react"
import { LeadCustomersPageClient } from "@/features/admin/leadCustomers/components/LeadCustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function ContentEntryLeadCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Users className="size-20" strokeWidth={1.5} />}
                    title="Potansiyel müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <LeadCustomersPageClient workspaceLabel="Veri Girişi Paneli" />
        </PageLoadingGate>
    )
}
