import { UserPlus } from "lucide-react"
import { SalesLeadCustomersPageClient } from "@/features/sales/leadCustomers/components/SalesLeadCustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesLeadCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<UserPlus className="size-20" strokeWidth={1.5} />}
                    title="Potansiyel müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SalesLeadCustomersPageClient />
        </PageLoadingGate>
    )
}
